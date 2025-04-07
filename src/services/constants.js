// Xác định môi trường hiện tại
const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const isVercel = window.location.hostname.includes('vercel.app') || window.location.hostname.includes('ntannn.tech');

// URLs cho từng môi trường
const DIRECT_URLS = {
    LOGIN_URL: "https://locketuploader-be-render.onrender.com/locket/login",
    UPLOAD_MEDIA_URL: "https://locketuploader-be-render.onrender.com/locket/upload-media",
};

const PROXY_URLS = {
    LOGIN_URL: "/api/login", 
    UPLOAD_MEDIA_URL: "/api/upload-media",
};

const constants = {
    apiRoutes: isLocalhost ? DIRECT_URLS : (isVercel ? PROXY_URLS : DIRECT_URLS),
    toastSettings: {
        position: "bottom-right",
        autoClose: 2000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
    },
    errorMessages: {
        networkError: "Không thể kết nối đến server. Vui lòng kiểm tra kết nối của bạn.",
        timeoutError: "Server đang phản hồi chậm. Vui lòng thử lại sau.",
        serverError: "Có lỗi xảy ra ở server. Vui lòng thử lại sau.",
        unauthorizedError: "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.",
        forbiddenError: "Bạn không có quyền thực hiện hành động này.",
        fileTooBig: "File quá lớn để xử lý. Vui lòng chọn file nhỏ hơn.",
        unsupportedFile: "Định dạng file không được hỗ trợ.",
        processingError: "Có lỗi xảy ra khi xử lý file. Vui lòng thử lại với file khác.",
    },
    fileConfig: {
        maxImageSize: 2 * 1024 * 1024, // 2MB cho giới hạn bình thường
        maxVideoSize: 10 * 1024 * 1024, // 10MB
        maxPngSize: 30 * 1024 * 1024, // 30MB cho file PNG
        allowedImageTypes: ['image/jpeg', 'image/png', 'image/gif'],
        allowedVideoTypes: ['video/mp4', 'video/webm', 'video/quicktime'],
        compressionSettings: {
            targetImageSize: 1024 * 1024, // 1MB là mục tiêu cuối cùng sau khi nén
            defaultJpegQuality: 0.9, // Chất lượng JPEG mặc định (0.9 = 90%)
            largePngJpegQuality: 0.7, // Chất lượng cho PNG lớn khi chuyển sang JPEG
        }
    },
    timeouts: {
        default: 30000, // 30 giây
        upload: 60000 // 60 giây
    }
};

export default constants;
