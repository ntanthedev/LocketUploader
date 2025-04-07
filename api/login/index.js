// Next.js API route proxy cho đăng nhập
import axios from 'axios';

export default async function handler(req, res) {
  // Thiết lập CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');

  // Xử lý OPTIONS request (preflight)
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Chỉ cho phép POST
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { email, password } = req.body;

  try {
    console.log('Proxy login API được gọi với email:', email);
    // Chuyển tiếp yêu cầu đến backend
    const response = await axios.post(
      'https://locketuploader-be-render.onrender.com/locket/login',
      { email, password },
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    console.log('Phản hồi từ backend:', response.status);
    // Trả về kết quả từ backend
    return res.status(response.status).json(response.data);
  } catch (error) {
    console.error('Login proxy error details:', {
      message: error?.response?.data?.message || error.message,
      status: error?.response?.status || 500
    });
    
    // Trả về lỗi từ backend
    return res.status(error.response?.status || 500).json(
      error.response?.data || { message: 'Đã xảy ra lỗi khi kết nối đến server' }
    );
  }
}