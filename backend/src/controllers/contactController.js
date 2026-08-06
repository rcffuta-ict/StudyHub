import Contact from '../models/Contact.js'

// @desc    Submit a contact message
// @route   POST /api/contact
// @access  Public
export const submitContactMessage = async (req, res, next) => {
  try {
    const { name, email, subject, message } = req.body

    if (!name || !email || !subject || !message) {
      return res.status(400).json({ message: 'Please fill in all fields' })
    }

    const newContact = await Contact.create({
      name,
      email,
      subject,
      message,
    })

    res.status(201).json({
      success: true,
      message: 'Your message has been submitted successfully! We will get back to you soon.',
      data: newContact,
    })
  } catch (error) {
    next(error)
  }
}

// @desc    Get all contact messages (Admin)
// @route   GET /api/admin/messages
// @access  Private/Admin
export const getContactMessages = async (req, res, next) => {
  try {
    const messages = await Contact.find().sort({ createdAt: -1 })
    res.json(messages)
  } catch (error) {
    next(error)
  }
}

// @desc    Update contact message status (Admin)
// @route   PATCH /api/admin/messages/:id/status
// @access  Private/Admin
export const updateMessageStatus = async (req, res, next) => {
  try {
    const { status } = req.body
    if (!['unread', 'read', 'resolved'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' })
    }

    const contact = await Contact.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    )

    if (!contact) {
      return res.status(404).json({ message: 'Message not found' })
    }

    res.json(contact)
  } catch (error) {
    next(error)
  }
}

// @desc    Delete contact message (Admin)
// @route   DELETE /api/admin/messages/:id
// @access  Private/Admin
export const deleteContactMessage = async (req, res, next) => {
  try {
    const contact = await Contact.findByIdAndDelete(req.params.id)
    if (!contact) {
      return res.status(404).json({ message: 'Message not found' })
    }
    res.json({ message: 'Message deleted successfully' })
  } catch (error) {
    next(error)
  }
}
