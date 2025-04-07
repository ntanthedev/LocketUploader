// Serverless function proxy cho đăng nhập
import axios from 'axios';

export default async function handler(req, res) {
  // Chỉ cho phép POST
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    // Chuyển tiếp yêu cầu đến backend
    const response = await axios.post(
      'https://locketuploader-be-render.onrender.com/locket/login',
      req.body,
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    // Trả về kết quả từ backend
    return res.status(response.status).json(response.data);
  } catch (error) {
    console.error('Login proxy error:', error.response?.data || error.message);
    
    // Trả về lỗi từ backend
    return res.status(error.response?.status || 500).json(
      error.response?.data || { message: 'Đã xảy ra lỗi khi kết nối đến server' }
    );
  }
}