import api from './api'

export const createEvent = (payload) => api.post('/events', payload)
export const getEvents = (params) => api.get('/events', { params })
export const getEvent = (id) => api.get(`/events/${id}`)
export const updateEvent = (id, payload) => api.put(`/events/${id}`, payload)
export const deleteEvent = (id) => api.delete(`/events/${id}`)
export const searchEvents = (params) => api.get('/events/search', { params })
export const updateEventStatus = (id, status) => api.patch(`/events/${id}/status`, { status })
export const uploadEventImage = (id, file) => {
	const formData = new FormData()
	formData.append('images', file)
	return api.post(`/events/${id}/images`, formData, { headers: { 'Content-Type': 'multipart/form-data' } })
}
export const uploadEventImages = (id, files) => {
	const formData = new FormData()
	files.forEach((file) => formData.append('images', file))
	return api.post(`/events/${id}/images`, formData, { headers: { 'Content-Type': 'multipart/form-data' } })
}
export const uploadEventVideos = (id, files) => {

	const formData = new FormData()
	files.forEach((file) => formData.append('videos', file))
	return api.post(`/events/${id}/videos`, formData, { headers: { 'Content-Type': 'multipart/form-data' } })
}
export const removeEventImage = (id, imageUrl) => api.delete(`/events/${id}/images`, { data: { imageUrl } })
export const inviteAttendees = (id, attendeeIds) => api.post(`/events/${id}/invitations`, { attendeeIds })
export const exportAttendees = (id) => api.get(`/events/${id}/attendees/export`, { responseType: 'blob' })
export const getPublicEvent = (publicId) => api.get(`/public/events/${publicId}`)
export const getPublicEvents = (params) => api.get('/public/events', { params })
export const submitPublicRsvp = (publicId, payload) => api.post(`/public/events/${publicId}/rsvp`, payload)
export const createPublicBooking = (publicId, payload) => api.post(`/bookings/events/${publicId}/book`, payload)
export const submitBookingPayment = (bookingRef, paymentReference, bookingAccessToken) => api.post(`/bookings/${bookingRef}/payment`, { paymentReference, bookingAccessToken })
export const createRazorpayOrder = (bookingRef, bookingAccessToken) => api.post(`/bookings/${bookingRef}/payment/order`, { bookingAccessToken })
export const verifyRazorpayPayment = (bookingRef, bookingAccessToken, paymentDetails) => api.post(`/bookings/${bookingRef}/payment/verify`, { bookingAccessToken, ...paymentDetails })
export const getBookingHistory = () => api.get('/bookings/history')
export const cancelBooking = (bookingRef) => api.patch(`/bookings/${bookingRef}/cancel`, {})
