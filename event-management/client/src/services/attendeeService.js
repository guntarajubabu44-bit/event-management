import api from './api'

export const addAttendee = (eventId, payload) => api.post(`/events/${eventId}/attendees`, payload)
export const getAttendees = (eventId, params = {}) => api.get(`/events/${eventId}/attendees`, { params: { ...params, _ts: Date.now() } })
export const getAttendee = (id) => api.get(`/attendees/${id}`)
export const updateAttendee = (id, payload) => api.put(`/attendees/${id}`, payload)
export const deleteAttendee = (id) => api.delete(`/attendees/${id}`)
export const toggleCheckIn = (id) => api.patch(`/attendees/${id}/checkin`)
