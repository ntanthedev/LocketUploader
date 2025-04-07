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
export const processImage = (imageFile, onProgress) => {
    return new Promise((resolve, reject) => {
        if (typeof onProgress === 'function') {
            onProgress('Đang đọc dữ liệu ảnh...');
        }
        
        // Tạo một đối tượng FileReader để đọc file
        const reader = new FileReader();
        reader.readAsDataURL(imageFile);
        
        reader.onload = (event) => {
            try {
                // Kiểm tra nếu ảnh đã nhỏ hơn 800KB thì giữ nguyên định dạng gốc
                if (imageFile.size < 800 * 1024) {
                    resolve(imageFile);
                    return;
                }
                
                // Với PNG kích thước lớn, cần xử lý đặc biệt
                const isPng = imageFile.type.includes('png');
                const isLarge = imageFile.size > 5 * 1024 * 1024; // Lớn hơn 5MB
                
                if (typeof onProgress === 'function') {
                    onProgress(`Đang xử lý ảnh${isPng ? ' PNG' : ''}${isLarge ? ' kích thước lớn' : ''}...`);
                }
                
                const img = new Image();
                img.onload = () => {
                    try {
                        // Xử lý với ảnh PNG lớn, chúng ta giảm độ phân giải mạnh hơn
                        let targetWidth, targetHeight;
                        let MAX_DIMENSION = 1600; // Giới hạn kích thước mặc định
                        
                        // Với PNG lớn, giảm kích thước mạnh hơn ngay từ đầu
                        if (isPng && isLarge) {
                            // Tính toán kích thước mục tiêu dựa trên kích thước ảnh gốc
                            const reductionFactor = Math.sqrt(imageFile.size / (5 * 1024 * 1024));
                            MAX_DIMENSION = Math.min(1600, Math.floor(1600 / reductionFactor));
                            
                            if (typeof onProgress === 'function') {
                                onProgress(`Giảm độ phân giải ảnh PNG lớn xuống ${MAX_DIMENSION}px...`);
                            }
                        }
                        
                        // Tính toán kích thước mới giữ nguyên tỷ lệ
                        if (img.width > img.height) {
                            // Ảnh ngang
                            targetWidth = Math.min(img.width, MAX_DIMENSION);
                            targetHeight = Math.round((img.height / img.width) * targetWidth);
                        } else {
                            // Ảnh dọc hoặc vuông
                            targetHeight = Math.min(img.height, MAX_DIMENSION);
                            targetWidth = Math.round((img.width / img.height) * targetHeight);
                        }
                        
                        // Tạo canvas với kích thước mới
                        const canvas = document.createElement('canvas');
                        const ctx = canvas.getContext('2d');
                        canvas.width = targetWidth;
                        canvas.height = targetHeight;
                        
                        // Vẽ hình ảnh với kích thước mới
                        ctx.fillStyle = '#FFFFFF'; // Nền trắng cho ảnh PNG có transparency
                        ctx.fillRect(0, 0, targetWidth, targetHeight);
                        ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
                        
                        // Thiết lập chất lượng ban đầu cho quá trình nén
                        let quality = isPng && isLarge ? 0.7 : 0.9; // Giảm chất lượng ngay từ đầu với PNG lớn
                        let attempts = 0;
                        const MAX_ATTEMPTS = 10;
                        
                        if (typeof onProgress === 'function') {
                            onProgress(`Đang nén ảnh với chất lượng ${Math.round(quality * 100)}%...`);
                        }
                        
                        // Hàm để chuyển đổi canvas thành blob và kiểm tra kích thước
                        const compressAndCheck = (q) => {
                            // Luôn dùng JPEG để nén tốt hơn, đặc biệt là với PNG
                            canvas.toBlob((blob) => {
                                attempts++;
                                
                                if (!blob) {
                                    reject(new Error("Không thể xử lý ảnh, vui lòng thử lại với ảnh khác"));
                                    return;
                                }
                                
                                const compressedSize = (blob.size/1024/1024).toFixed(2);
                                console.log(`Lần nén thứ ${attempts}: ${compressedSize}MB với chất lượng ${Math.round(q * 100)}%`);
                                
                                if (typeof onProgress === 'function') {
                                    onProgress(`Đang nén ảnh: ${compressedSize}MB (chất lượng: ${Math.round(q * 100)}%)`);
                                }
                                
                                if (blob.size <= 1024 * 1024) {  // Nếu dưới 1MB
                                    // Đổi đuôi thành .jpg nếu là file PNG
                                    let newFileName = imageFile.name;
                                    if (isPng) {
                                        newFileName = newFileName.replace(/\.png$/i, '.jpg');
                                        if (newFileName === imageFile.name) { // Nếu không có đuôi .png
                                            newFileName += '.jpg';
                                        }
                                    }
                                    
                                    // Tạo file mới
                                    const newFile = new File([blob], newFileName, {
                                        type: 'image/jpeg',
                                        lastModified: new Date().getTime()
                                    });
                                    
                                    if (typeof onProgress === 'function') {
                                        onProgress(`Đã xử lý ảnh thành công: ${(newFile.size/1024).toFixed(2)}KB`);
                                    }
                                    
                                    resolve(newFile);
                                } else if (attempts >= MAX_ATTEMPTS) {
                                    // Nếu đã thử quá nhiều lần, giảm kích thước ảnh
                                    const newWidth = Math.max(canvas.width * 0.7, 800); // Không giảm quá nhỏ
                                    const newHeight = Math.max(canvas.height * 0.7, 800);
                                    
                                    console.log(`Giảm kích thước ảnh từ ${canvas.width}x${canvas.height} xuống ${newWidth}x${newHeight}`);
                                    
                                    if (typeof onProgress === 'function') {
                                        onProgress(`Giảm độ phân giải ảnh xuống ${Math.round(newWidth)}x${Math.round(newHeight)}...`);
                                    }
                                    
                                    canvas.width = newWidth;
                                    canvas.height = newHeight;
                                    
                                    // Vẽ lại ảnh với kích thước mới
                                    ctx.fillStyle = '#FFFFFF';
                                    ctx.fillRect(0, 0, newWidth, newHeight);
                                    ctx.drawImage(img, 0, 0, newWidth, newHeight);
                                    
                                    // Reset thử lại với chất lượng mới
                                    attempts = 0;
                                    quality = 0.6; // Thử với chất lượng thấp hơn sau khi giảm kích thước
                                    compressAndCheck(quality);
                                } else {
                                    // Tính toán chất lượng mới dựa trên kích thước hiện tại
                                    // Thuật toán này sẽ giúp tìm ra mức chất lượng phù hợp nhanh hơn
                                    const targetRatio = 1024 * 1024 / blob.size;
                                    // Điều chỉnh chất lượng một cách thông minh
                                    quality = Math.max(0.1, Math.min(0.9, quality * Math.pow(targetRatio, 0.7)));
                                    
                                    console.log(`Thử lại với chất lượng: ${Math.round(quality * 100)}%, kích thước hiện tại: ${compressedSize}MB`);
                                    compressAndCheck(quality);
                                }
                            }, 'image/jpeg', q);
                        };
                        
                        // Bắt đầu quá trình nén
                        compressAndCheck(quality);
                    } catch (err) {
                        console.error("Lỗi xử lý ảnh:", err);
                        reject(new Error("Không thể xử lý ảnh, có lỗi xảy ra khi nén"));
                    }
                };
                
                img.onerror = (error) => {
                    console.error("Lỗi tải ảnh:", error);
                    reject(new Error("Không thể tải ảnh, định dạng ảnh không được hỗ trợ hoặc bị hỏng"));
                };
                
                img.src = event.target.result;
            } catch (err) {
                console.error("Lỗi xử lý ảnh:", err);
                reject(new Error("Không thể xử lý ảnh, có lỗi xảy ra"));
            }
        };
        
        reader.onerror = (error) => {
            console.error("Lỗi đọc file:", error);
            reject(new Error("Không thể đọc file, vui lòng thử lại"));
        };
    });
};

// Hàm xử lý video: giảm kích thước video nếu cần
export const processVideo = (videoFile, onProgress) => {
    return new Promise(async (resolve, reject) => {
        try {
            // Kiểm tra kích thước video
            if (videoFile.size <= 10 * 1024 * 1024) {  // Nếu video dưới 10MB
                resolve(videoFile);  // Trả về video gốc
                return;
            }
            
            // Thông báo bắt đầu xử lý
            if (typeof onProgress === 'function') {
                onProgress('Bắt đầu xử lý video...');
            }
            
            // Tính toán mức nén cần thiết dựa trên kích thước file
            const compressionRatio = Math.min(0.9, (10 * 1024 * 1024) / videoFile.size);
            
            // Lazy load FFmpeg để không ảnh hưởng đến hiệu suất trang
            if (typeof onProgress === 'function') {
                onProgress('Đang tải công cụ xử lý video...');
            }
            
            const { createFFmpeg, fetchFile } = await import('@ffmpeg/ffmpeg');
            const ffmpeg = createFFmpeg({ 
                log: true,
                corePath: 'https://unpkg.com/@ffmpeg/core@0.11.0/dist/ffmpeg-core.js',
                logger: ({ message }) => {
                    console.log('FFmpeg Log:', message);
                    // Cập nhật tiến trình dựa trên log
                    if (typeof onProgress === 'function' && message.includes('frame=')) {
                        onProgress('Đang xử lý video: ' + message);
                    }
                }
            });
            
            // Load FFMPEG
            if (!ffmpeg.isLoaded()) {
                await ffmpeg.load();
            }
            
            if (typeof onProgress === 'function') {
                onProgress('Đang chuẩn bị video để xử lý...');
            }
            
            // Đọc file video
            const inputFileName = 'input' + (videoFile.name.includes('.') ? videoFile.name.substring(videoFile.name.lastIndexOf('.')) : '.mp4');
            const outputFileName = 'output.mp4';
            
            ffmpeg.FS('writeFile', inputFileName, await fetchFile(videoFile));
            
            if (typeof onProgress === 'function') {
                onProgress('Đang xử lý và nén video...');
            }
            
            // Tính toán các tham số nén dựa trên kích thước file
            const crf = Math.floor(23 + (1 - compressionRatio) * 28); // CRF từ 23-51 (23 là chất lượng cao, 51 là thấp nhất)
            const scale = compressionRatio < 0.5 ? '-vf scale=iw*0.8:ih*0.8' : ''; // Giảm kích thước nếu cần nén nhiều
            
            // Nén video với libx264 (H.264) với chất lượng phù hợp
            // Sử dụng preset để cân bằng giữa thời gian nén và chất lượng
            await ffmpeg.run(
                '-i', inputFileName,
                '-c:v', 'libx264',
                '-preset', 'veryfast', // Nén nhanh hơn với chất lượng chấp nhận được
                '-crf', crf.toString(),
                ...scale.split(' ').filter(Boolean), // Thêm scale nếu cần
                '-c:a', 'aac',  // Nén âm thanh
                '-b:a', '128k', // Bitrate âm thanh thấp hơn
                '-movflags', '+faststart', // Tối ưu cho web streaming
                '-y', // Ghi đè output nếu đã tồn tại
                outputFileName
            );
            
            if (typeof onProgress === 'function') {
                onProgress('Đang hoàn thiện video...');
            }
            
            // Đọc file đã nén
            const compressedData = ffmpeg.FS('readFile', outputFileName);
            
            // Tạo file mới
            const compressedFile = new File(
                [compressedData.buffer], 
                videoFile.name,
                { type: 'video/mp4', lastModified: new Date().getTime() }
            );
            
            // Giải phóng bộ nhớ
            ffmpeg.FS('unlink', inputFileName);
            ffmpeg.FS('unlink', outputFileName);
            
            console.log(`Video đã được nén từ ${(videoFile.size/1024/1024).toFixed(2)}MB xuống ${(compressedFile.size/1024/1024).toFixed(2)}MB`);
            
            // Kiểm tra lại kích thước
            if (compressedFile.size > 10 * 1024 * 1024) {
                // Nếu vẫn lớn hơn 10MB, thông báo cho người dùng
                console.log("Video vẫn quá lớn sau khi nén");
                reject(new Error('Không thể nén video xuống dưới 10MB, vui lòng thử video ngắn hơn hoặc chất lượng thấp hơn'));
            } else {
                if (typeof onProgress === 'function') {
                    onProgress('Hoàn tất xử lý video!');
                }
                resolve(compressedFile);
            }
        } catch (error) {
            console.error("Lỗi xử lý video:", error);
            reject(new Error('Không thể xử lý video, vui lòng thử lại với video khác hoặc kiểm tra trình duyệt của bạn'));
        }
    });
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
