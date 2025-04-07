// Serverless function proxy cho upload media
import axios from 'axios';
import FormData from 'form-data';
import { buffer } from 'micro';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    // Đọc dữ liệu nhị phân từ request
    const bodyBuffer = await buffer(req);
    
    // Lấy content-type từ header
    const contentType = req.headers['content-type'] || '';
    
    // Chuyển tiếp yêu cầu đến backend
    const response = await axios.post(
      'https://locketuploader-be-render.onrender.com/locket/upload-media',
      bodyBuffer,
      {
        headers: {
          'Content-Type': contentType,
        },
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
      }
    );

    return res.status(response.status).json(response.data);
  } catch (error) {
    console.error('Upload proxy error:', error.response?.data || error.message);
    
    return res.status(error.response?.status || 500).json(
      error.response?.data || { message: 'Đã xảy ra lỗi khi kết nối đến server' }
    );
  }
}