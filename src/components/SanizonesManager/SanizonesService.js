import axios from 'axios'

const API_BASE_URL = 'http://localhost:5000/api/sanitzones' // Замените на ваш API endpoint

export default {
  async getSanizones() {
    const response = await axios.get(API_BASE_URL)
    return response.data
  },

  async createSanizone(sanizone) {
    const response = await axios.post(API_BASE_URL, sanizone)
    return response.data
  },

  async updateSanizone(sanizone) {
    const response = await axios.put(`${API_BASE_URL}/${sanizone.id}`, sanizone)
    return response.data
  },

  async deleteSanizone(id) {
    await axios.delete(`${API_BASE_URL}/${id}`)
  }
}