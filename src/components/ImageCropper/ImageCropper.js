import React, { useState, useRef, useEffect } from 'react';
import ReactCrop, { centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import styles from './ImageCropper.module.scss';
import classNames from 'classnames/bind';

const cx = classNames.bind(styles);

const ImageCropper = ({ imageFile, onImageCropped, onCancel }) => {
  const [crop, setCrop] = useState();
  const [imgSrc, setImgSrc] = useState('');
  const imgRef = useRef(null);

  // Đọc file ảnh và chuyển đổi thành URL để hiển thị
  useEffect(() => {
    if (!imageFile) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      setImgSrc(e.target.result);
    };
    reader.readAsDataURL(imageFile);

    return () => {
      if (imgSrc) {
        URL.revokeObjectURL(imgSrc);
      }
    };
  }, [imageFile]);

  // Thiết lập crop mặc định thành hình vuông khi ảnh được tải
  const onImageLoad = (e) => {
    const { width, height } = e.currentTarget;
    const cropWidthInPercent = (width < height ? 100 : (height / width) * 100);
    const cropHeightInPercent = (height < width ? 100 : (width / height) * 100);
    
    const crop = centerCrop(
      makeAspectCrop(
        {
          unit: '%',
          width: cropWidthInPercent,
          height: cropHeightInPercent
        },
        1, // Tỷ lệ khung hình (1 = hình vuông)
        width,
        height
      ),
      width,
      height
    );

    setCrop(crop);
    imgRef.current = e.currentTarget;
  };

  // Hàm thực hiện crop ảnh khi người dùng nhấn Apply
  const handleCropImage = () => {
    if (!imgRef.current || !crop) return;

    const canvas = document.createElement('canvas');
    const scaleX = imgRef.current.naturalWidth / imgRef.current.width;
    const scaleY = imgRef.current.naturalHeight / imgRef.current.height;
    
    const pixelRatio = window.devicePixelRatio || 1;
    const cropWidth = crop.width * scaleX;
    const cropHeight = crop.height * scaleY;

    canvas.width = cropWidth * pixelRatio;
    canvas.height = cropHeight * pixelRatio;
    
    const ctx = canvas.getContext('2d');
    
    ctx.scale(pixelRatio, pixelRatio);
    ctx.imageSmoothingQuality = 'high';
    
    // Tính toán tọa độ crop
    const cropX = crop.x * scaleX;
    const cropY = crop.y * scaleY;
    
    ctx.drawImage(
      imgRef.current,
      cropX,
      cropY,
      cropWidth,
      cropHeight,
      0,
      0,
      cropWidth,
      cropHeight
    );

    // Chuyển đổi canvas thành blob
    canvas.toBlob((blob) => {
      if (!blob) {
        console.error('Canvas is empty');
        return;
      }
      
      // Tạo file mới từ blob đã crop
      const croppedFile = new File([blob], imageFile.name, {
        type: imageFile.type,
        lastModified: new Date().getTime()
      });
      
      // Gọi hàm callback với file đã crop
      onImageCropped(croppedFile);
    }, imageFile.type);
  };

  return (
    <div className={cx('cropper-container')}>
      <div className={cx('crop-instruction')}>
        Kéo hoặc thay đổi kích thước để chọn vùng cần crop thành hình vuông
      </div>
      
      {imgSrc && (
        <ReactCrop
          crop={crop}
          onChange={(c) => setCrop(c)}
          aspect={1}
          circularCrop={false}
        >
          <img 
            src={imgSrc} 
            onLoad={onImageLoad} 
            alt="Crop preview" 
            style={{ maxHeight: '400px' }}
          />
        </ReactCrop>
      )}
      
      <div className={cx('cropper-controls')}>
        <div className={cx('cropper-buttons')}>
          <button 
            className={cx('cropper-button', 'cancel-button')} 
            onClick={onCancel}
          >
            Hủy
          </button>
          <button 
            className={cx('cropper-button', 'apply-button')} 
            onClick={handleCropImage}
          >
            Áp dụng
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImageCropper;