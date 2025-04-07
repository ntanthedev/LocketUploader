export const setCookie = (name, value, hours) => {
    const d = new Date();
    d.setTime(d.getTime() + hours * 60 * 60 * 1000);
    const expires = `expires=${d.toUTCString()}`;
    document.cookie = `${name}=${encodeURIComponent(
        value,
    )}; ${expires}; path=/`;
};

export const getCookie = (name) => {
    const nameEQ = `${name}=`;
    const cookies = document.cookie.split(";");
    for (const c of cookies) {
        const cookie = c.trim();
        if (cookie.startsWith(nameEQ))
            return decodeURIComponent(
                cookie.substring(nameEQ.length, cookie.length),
            );
    }
    return null;
};

export const deleteCookie = (name) => {
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
};

export const validateEmail = (email) => {
    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
    return emailRegex.test(email);
};

// Hàm xử lý hình ảnh: tối ưu và giảm kích thước dưới 1MB
export const processImage = async (imageFile, onProgress) => {
    try {
        if (typeof onProgress === 'function') {
            onProgress('Đang đọc dữ liệu ảnh...');
        }
        
        // Kiểm tra nếu ảnh đã nhỏ hơn 800KB thì giữ nguyên định dạng gốc
        if (imageFile.size < 800 * 1024) {
            return imageFile;
        }
        
        // Import thư viện nén ảnh khi cần dùng
        const imageCompression = await import('browser-image-compression');
        
        // Với PNG kích thước lớn, cần xử lý đặc biệt
        const isPng = imageFile.type.includes('png');
        const isLarge = imageFile.size > 5 * 1024 * 1024; // Lớn hơn 5MB
        
        if (typeof onProgress === 'function') {
            onProgress(`Đang xử lý ảnh${isPng ? ' PNG' : ''}${isLarge ? ' kích thước lớn' : ''}...`);
        }

        // Tính toán maxWidthOrHeight dựa trên kích thước ảnh ban đầu
        let maxWidthOrHeight = 1600; // Mặc định
        if (isPng && isLarge) {
            const reductionFactor = Math.sqrt(imageFile.size / (5 * 1024 * 1024));
            maxWidthOrHeight = Math.min(1600, Math.floor(1600 / reductionFactor));
        }
        
        // Tạo các tùy chọn nén ảnh
        const options = {
            maxSizeMB: 1,                     // Giới hạn kích thước tối đa 1MB
            maxWidthOrHeight: maxWidthOrHeight, // Giới hạn kích thước
            useWebWorker: true,              // Sử dụng WebWorker để không chặn UI
            maxIteration: 10,                // Số lần lặp tối đa để tìm mức nén tốt nhất
            initialQuality: isPng && isLarge ? 0.7 : 0.9, // Chất lượng ban đầu thấp hơn cho PNG lớn
            onProgress: (progress) => {
                if (typeof onProgress === 'function') {
                    onProgress(`Đang nén ảnh: ${Math.round(progress * 100)}%`);
                }
            },
            fileType: 'image/jpeg',          // Luôn chuyển sang JPEG để nén tốt hơn
            alwaysKeepResolution: false      // Cho phép giảm độ phân giải nếu cần
        };
        
        // Thực hiện nén ảnh
        const compressedFile = await imageCompression.default(imageFile, options);
        
        // Đổi tên file nếu đã chuyển từ PNG sang JPEG
        if (isPng) {
            let newFileName = imageFile.name;
            newFileName = newFileName.replace(/\.png$/i, '.jpg');
            if (newFileName === imageFile.name) { // Nếu không có đuôi .png
                newFileName += '.jpg';
            }
            
            // Tạo file mới với tên đã được cập nhật
            const renamedFile = new File([compressedFile], newFileName, {
                type: 'image/jpeg',
                lastModified: new Date().getTime()
            });
            
            if (typeof onProgress === 'function') {
                onProgress(`Đã xử lý ảnh thành công: ${(renamedFile.size/1024).toFixed(2)}KB`);
            }
            
            return renamedFile;
        }
        
        if (typeof onProgress === 'function') {
            onProgress(`Đã xử lý ảnh thành công: ${(compressedFile.size/1024).toFixed(2)}KB`);
        }
        
        return compressedFile;
    } catch (err) {
        console.error("Lỗi xử lý ảnh:", err);
        throw new Error("Không thể xử lý ảnh, vui lòng thử lại với ảnh khác");
    }
};

// Hàm xử lý video: giảm kích thước video sử dụng canvas và MediaRecorder
export const processVideo = async (videoFile, onProgress) => {
    try {
        // Kiểm tra kích thước video
        if (videoFile.size <= 10 * 1024 * 1024) {  // Nếu video dưới 10MB
            return videoFile;  // Trả về video gốc
        }
        
        // Thông báo bắt đầu xử lý
        if (typeof onProgress === 'function') {
            onProgress('Bắt đầu xử lý video...');
        }
        
        // Trước hết, kiểm tra tính khả dụng của MediaRecorder và Canvas API
        if (!window.MediaRecorder || !document.createElement('canvas').getContext) {
            console.warn("Trình duyệt không hỗ trợ các API cần thiết để xử lý video");
            return videoFile; // Trả về video gốc nếu không thể xử lý
        }
        
        return new Promise((resolve, reject) => {
            // Tính toán các thông số nén dựa trên kích thước hiện tại
            const originalSize = videoFile.size;
            const targetSize = 10 * 1024 * 1024; // 10MB
            const compressionRatio = Math.max(0.5, Math.min(0.9, targetSize / originalSize));
            
            // Tạo URL cho video
            const videoURL = URL.createObjectURL(videoFile);
            const video = document.createElement('video');
            
            // Thiết lập các thuộc tính video
            video.autoplay = false;
            video.muted = true;
            video.loop = false;
            video.preload = 'metadata';
            
            video.addEventListener('loadedmetadata', () => {
                if (typeof onProgress === 'function') {
                    onProgress(`Đã tải metadata video: ${video.videoWidth}x${video.videoHeight}, độ dài: ${video.duration.toFixed(2)}s`);
                }
                
                // Tính toán kích thước mới để giảm độ phân giải
                const scaleRatio = Math.max(0.6, Math.min(1.0, compressionRatio * 1.2));
                const newWidth = Math.floor(video.videoWidth * scaleRatio);
                const newHeight = Math.floor(video.videoHeight * scaleRatio);
                
                // Tạo canvas với kích thước mới
                const canvas = document.createElement('canvas');
                canvas.width = newWidth;
                canvas.height = newHeight;
                const ctx = canvas.getContext('2d');
                
                // Thiết lập cho MediaRecorder
                const stream = canvas.captureStream(30); // 30fps
                
                // Tính toán bitrate dựa trên kích thước mong muốn
                // Công thức: bitrate = target_size_bits / video_duration_seconds
                const videoBitrate = Math.floor((targetSize * 8 * compressionRatio) / video.duration);
                const audioBitrate = Math.min(128000, videoBitrate * 0.1); // Giữ audio ở mức thấp hơn
                
                // Thiết lập các tùy chọn nén
                const options = {
                    mimeType: 'video/webm;codecs=vp9', // Sử dụng VP9 cho nén hiệu quả hơn
                    videoBitsPerSecond: videoBitrate,
                    audioBitsPerSecond: audioBitrate
                };
                
                // Thử các định dạng khác nhau nếu trình duyệt không hỗ trợ VP9
                const mimeTypes = [
                    'video/webm;codecs=vp9',
                    'video/webm;codecs=vp8',
                    'video/webm',
                    'video/mp4'
                ];
                
                let selectedMimeType = null;
                for (const type of mimeTypes) {
                    if (MediaRecorder.isTypeSupported(type)) {
                        selectedMimeType = type;
                        options.mimeType = type;
                        break;
                    }
                }
                
                if (!selectedMimeType) {
                    console.warn('Không tìm thấy định dạng nén được hỗ trợ');
                    resolve(videoFile); // Trả về video gốc nếu không thể xử lý
                    return;
                }
                
                // Tạo MediaRecorder
                const mediaRecorder = new MediaRecorder(stream, options);
                const chunks = [];
                
                // Xử lý sự kiện dataavailable
                mediaRecorder.ondataavailable = (e) => {
                    if (e.data.size > 0) {
                        chunks.push(e.data);
                    }
                };
                
                // Xử lý khi việc ghi hoàn tất
                mediaRecorder.onstop = () => {
                    // Tạo blob từ các chunks dữ liệu
                    const blob = new Blob(chunks, { type: selectedMimeType.split(';')[0] });
                    
                    // Tạo file mới
                    const fileExtension = selectedMimeType.includes('webm') ? '.webm' : '.mp4';
                    const fileName = videoFile.name.replace(/\.[^.]+$/, '') + fileExtension;
                    
                    const compressedFile = new File([blob], fileName, {
                        type: blob.type,
                        lastModified: new Date().getTime()
                    });
                    
                    console.log(`Video đã được nén từ ${(originalSize/1024/1024).toFixed(2)}MB xuống ${(compressedFile.size/1024/1024).toFixed(2)}MB`);
                    
                    // Kiểm tra kích thước sau khi nén
                    if (compressedFile.size > targetSize) {
                        console.warn("Video vẫn lớn hơn kích thước mong muốn sau khi nén");
                        // Nếu kích thước vẫn lớn, có thể thử lại với tỷ lệ nén cao hơn hoặc trả về lỗi
                        if (compressedFile.size < originalSize) {
                            // Nếu đã nén được một phần, vẫn trả về kết quả
                            if (typeof onProgress === 'function') {
                                onProgress(`Đã giảm kích thước video xuống ${(compressedFile.size/1024/1024).toFixed(2)}MB`);
                            }
                            resolve(compressedFile);
                        } else {
                            reject(new Error('Không thể nén video, vui lòng thử video ngắn hơn hoặc chất lượng thấp hơn'));
                        }
                    } else {
                        if (typeof onProgress === 'function') {
                            onProgress('Hoàn tất xử lý video!');
                        }
                        resolve(compressedFile);
                    }
                    
                    // Giải phóng bộ nhớ
                    URL.revokeObjectURL(videoURL);
                };
                
                // Bắt đầu ghi
                mediaRecorder.start(1000); // Ghi theo từng đoạn 1 giây
                
                // Xử lý lỗi
                mediaRecorder.onerror = (event) => {
                    console.error('Lỗi MediaRecorder:', event);
                    URL.revokeObjectURL(videoURL);
                    reject(new Error('Lỗi khi nén video'));
                };
                
                // Bắt đầu xử lý video
                let currentTime = 0;
                const timeSlice = 1 / 30; // 1/30 giây mỗi frame
                
                if (typeof onProgress === 'function') {
                    onProgress('Đang xử lý video...');
                }
                
                video.addEventListener('seeked', function processFrame() {
                    if (currentTime < video.duration) {
                        // Vẽ frame hiện tại lên canvas
                        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                        
                        // Cập nhật tiến trình
                        const progress = currentTime / video.duration;
                        if (typeof onProgress === 'function' && Math.floor(progress * 100) % 10 === 0) {
                            onProgress(`Đang xử lý video: ${Math.floor(progress * 100)}%`);
                        }
                        
                        // Di chuyển đến frame tiếp theo
                        currentTime += timeSlice;
                        video.currentTime = Math.min(currentTime, video.duration - 0.01);
                        
                        // Tiếp tục xử lý
                        video.addEventListener('seeked', processFrame, { once: true });
                    } else {
                        // Kết thúc xử lý
                        if (typeof onProgress === 'function') {
                            onProgress('Đang hoàn thiện video...');
                        }
                        mediaRecorder.stop();
                    }
                }, { once: true });
                
                // Bắt đầu xử lý từ đầu video
                video.currentTime = 0;
            });
            
            // Xử lý lỗi khi tải video
            video.onerror = (error) => {
                console.error("Lỗi tải video:", error);
                URL.revokeObjectURL(videoURL);
                reject(new Error("Không thể tải video để xử lý, định dạng không được hỗ trợ hoặc bị hỏng"));
            };
            
            // Bắt đầu tải video
            video.src = videoURL;
            video.load();
        });
    } catch (error) {
        console.error("Lỗi xử lý video:", error);
        throw new Error('Không thể xử lý video, vui lòng thử lại với video khác hoặc kiểm tra trình duyệt của bạn');
    }
};

// Hàm kiểm tra và xử lý file media (ảnh hoặc video)
export const processMedia = (file, onProgress) => {
    // Import constants từ service
    const constants = require('~/services/constants').default;
    
    // Kiểm tra kích thước và loại file
    if (file.type.includes('image')) {
        // Đối xử đặc biệt với PNG
        const isPng = file.type.includes('png');
        
        // Kiểm tra loại ảnh
        if (!constants.fileConfig.allowedImageTypes.some(type => file.type.includes(type))) {
            return Promise.reject(new Error(constants.errorMessages.unsupportedFile));
        }
        
        // Kiểm tra kích thước trước khi xử lý, áp dụng giới hạn khác nhau cho PNG và các định dạng khác
        if (isPng) {
            // Cho phép PNG lớn hơn, lên đến maxPngSize (30MB)
            if (file.size > constants.fileConfig.maxPngSize) {
                return Promise.reject(new Error(constants.errorMessages.fileTooBig));
            }
        } else {
            // Giới hạn thấp hơn cho các định dạng ảnh khác
            if (file.size > constants.fileConfig.maxImageSize * 5) {
                return Promise.reject(new Error(constants.errorMessages.fileTooBig));
            }
        }
        
        if (typeof onProgress === 'function') {
            onProgress('Đang phân tích ảnh...');
            if (isPng && file.size > 5 * 1024 * 1024) {
                onProgress(`Đang chuẩn bị xử lý ảnh PNG lớn (${(file.size/1024/1024).toFixed(2)}MB)...`);
            }
        }
        
        return processImage(file, onProgress);
    } else if (file.type.includes('video')) {
        // Kiểm tra loại video
        if (!constants.fileConfig.allowedVideoTypes.some(type => file.type.includes(type))) {
            return Promise.reject(new Error(constants.errorMessages.unsupportedFile));
        }
        
        // Kiểm tra kích thước - cho phép xử lý video lớn hơn, lên đến 100MB
        if (file.size > constants.fileConfig.maxVideoSize * 10) { // 100MB
            return Promise.reject(new Error(constants.errorMessages.fileTooBig));
        }
        
        return processVideo(file, onProgress);
    } else {
        return Promise.reject(new Error(constants.errorMessages.unsupportedFile));
    }
};
