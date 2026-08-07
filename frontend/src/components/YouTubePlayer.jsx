import { useEffect, useRef, useState } from 'react'

const YouTubePlayer = ({ videoId, onVideoEnd, onProgress, autoplay = false }) => {
  const playerRef = useRef(null)
  const containerRef = useRef(null)
  const [isReady, setIsReady] = useState(false)
  const progressIntervalRef = useRef(null)

  useEffect(() => {
    // Load YouTube IFrame API
    if (!window.YT) {
      const tag = document.createElement('script')
      tag.src = 'https://www.youtube.com/iframe_api'
      const firstScriptTag = document.getElementsByTagName('script')[0]
      firstScriptTag.parentNode.insertBefore(tag, firstScriptTag)

      window.onYouTubeIframeAPIReady = initializePlayer
    } else if (window.YT.Player) {
      initializePlayer()
    }

    function initializePlayer() {
      if (!containerRef.current || !videoId) return

      // Destroy existing player if any
      if (playerRef.current && playerRef.current.destroy) {
        playerRef.current.destroy()
      }

      const player = new window.YT.Player(containerRef.current, {
        height: '100%',
        width: '100%',
        videoId: videoId,
        playerVars: {
          autoplay: autoplay ? 1 : 0,
          controls: 1,
          rel: 0, // Only show related videos from same channel
          modestbranding: 1, // Remove YouTube logo
          disablekb: 0, // Allow keyboard controls
          playsinline: 1, // Play inline on mobile
          iv_load_policy: 3, // Hide annotations
          fs: 1, // Allow fullscreen
          cc_load_policy: 0, // Hide captions by default
        },
        events: {
          onReady: (event) => {
            playerRef.current = event.target
            setIsReady(true)
          },
          onStateChange: (event) => {
            // Track when video ends
            if (event.data === window.YT.PlayerState.ENDED) {
              onVideoEnd && onVideoEnd()
              if (progressIntervalRef.current) {
                clearInterval(progressIntervalRef.current)
              }
            }
            
            // Track progress (every 10 seconds)
            if (event.data === window.YT.PlayerState.PLAYING) {
              // Clear any existing interval
              if (progressIntervalRef.current) {
                clearInterval(progressIntervalRef.current)
              }

              progressIntervalRef.current = setInterval(() => {
                if (playerRef.current && playerRef.current.getCurrentTime && playerRef.current.getDuration) {
                  try {
                    const currentTime = playerRef.current.getCurrentTime()
                    const duration = playerRef.current.getDuration()
                    const progress = (currentTime / duration) * 100
                    onProgress && onProgress({
                      currentTime,
                      duration,
                      progress
                    })
                  } catch (error) {
                    console.error('Error getting video progress:', error)
                  }
                }
              }, 10000) // Update every 10 seconds
            } else {
              // Clear interval when video pauses or stops
              if (progressIntervalRef.current) {
                clearInterval(progressIntervalRef.current)
                progressIntervalRef.current = null
              }
            }
          },
          onError: (event) => {
            console.error('YouTube Player Error:', event.data)
          }
        }
      })
    }

    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current)
      }
      if (playerRef.current && playerRef.current.destroy) {
        playerRef.current.destroy()
      }
    }
  }, [videoId, autoplay])

  return (
    <div className="w-full h-[50vh] min-h-[280px] max-h-[480px] sm:h-auto sm:aspect-video bg-black rounded-xl overflow-hidden relative">
      <div ref={containerRef} className="w-full h-full"></div>
      {!isReady && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
          <div className="text-white text-sm font-medium animate-pulse">Loading video...</div>
        </div>
      )}
    </div>
  )
}

export default YouTubePlayer

