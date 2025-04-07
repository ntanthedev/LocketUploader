import React, { useContext, useEffect, useRef, useState } from "react";
import styles from "./Upload.module.scss";
import classNames from "classnames/bind";
import { toast } from "react-toastify";
import PropTypes from "prop-types";

import { AuthContext } from "~/contexts/AuthContext";
import constants from "~/services/constants";
import images from "~/assets/images";
import LoginModal from "../Modals/Login/LoginModal";
import ImageCropper from "../ImageCropper";
import * as miscFuncs from "~/helper/misc-functions";
import * as lockerService from "~/services/locketService";
import Help from "../Modals/Login/Help";
const cx = classNames.bind(styles);

const Upload = () => {
    const { user, setUser, isLoading } = useContext(AuthContext);

    const [file, setFile] = useState(null);
    const [caption, setCaption] = useState("");
    const [previewUrl, setPreviewUrl] = useState("");
    const [isShowModal, setIsShowModal] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [processingStatus, setProcessingStatus] = useState("");
    const [processingToastId, setProcessingToastId] = useState(null);
    const [processingProgress, setProcessingProgress] = useState(0);
    const [showCropper, setShowCropper] = useState(false);
    const [originalFile, setOriginalFile] = useState(null);
    
    const fileRef = useRef(null);
    const uploadAreaRef = useRef(null);

    useEffect(() => {
        return () => {
            if (previewUrl) {
                URL.revokeObjectURL(previewUrl);
            }
        };
    }, [previewUrl]);

    // Thêm event listener để xử lý sự kiện paste (Ctrl+V)
    useEffect(() => {
        const handlePaste = async (e) => {
            if (!user || isUploading) return; // Không xử lý nếu chưa đăng nhập hoặc đang upload

            const items = e.clipboardData?.items;
            if (!items) return;

            let file = null;

            // Tìm item chứa hình ảnh trong clipboard
            for (let i = 0; i < items.length; i++) {
                if (items[i].type.indexOf('image') !== -1) {
                    file = items[i].getAsFile();
                    break;
                }
            }

            if (file) {
                e.preventDefault(); // Ngăn chặn hành động mặc định của paste

                try {
                    setIsUploading(true);
                    setProcessingStatus("Đang chuẩn bị xử lý ảnh từ clipboard...");
                    
                    // Hiển thị toast thông báo đang xử lý
                    const toastId = toast.info("Đang xử lý ảnh từ clipboard...", {
                        ...constants.toastSettings,
                        autoClose: false,
                    });
                    setProcessingToastId(toastId);
                    
                    // Đổi tên file để dễ nhận biết nguồn gốc
                    const renamedFile = new File([file], `clipboard_image_${new Date().getTime()}.png`, {
                        type: file.type,
                        lastModified: new Date().getTime()
                    });
                    
                    // Xử lý file với hàm callback cập nhật trạng thái
                    const processedFile = await miscFuncs.processMedia(renamedFile, updateProcessingStatus);
                    
                    const objectUrl = URL.createObjectURL(processedFile);
                    setFile(processedFile);
                    setPreviewUrl(objectUrl);
                    
                    // Thông báo hoàn tất xử lý file
                    toast.update(toastId, {
                        render: `Đã xử lý ảnh thành công: ${(processedFile.size/1024/1024).toFixed(2)}MB`,
                        type: toast.TYPE.SUCCESS,
                        ...constants.toastSettings,
                        autoClose: 3000,
                    });
                    
                    setProcessingToastId(null);
                    setIsUploading(false);
                } catch (error) {
                    if (processingToastId) {
                        toast.dismiss(processingToastId);
                    }
                    toast.error(error.message, {
                        ...constants.toastSettings,
                    });
                    setProcessingToastId(null);
                    setIsUploading(false);
                }
            }
        };

        // Chỉ gắn event listener khi đã đăng nhập
        if (user) {
            document.addEventListener('paste', handlePaste);
        }

        return () => {
            document.removeEventListener('paste', handlePaste);
        };
    }, [user, isUploading, processingToastId]);

    // Hiển thị thông báo tiến trình xử lý media
    const updateProcessingStatus = (status) => {
        setProcessingStatus(status);
        
        // Cập nhật giá trị tiến độ nếu có thông tin phần trăm
        if (status.includes('%')) {
            try {
                const percentMatch = status.match(/(\d+)%/);
                if (percentMatch && percentMatch[1]) {
                    setProcessingProgress(parseInt(percentMatch[1]));
                }
            } catch (error) {
                console.error('Lỗi phân tích tiến độ:', error);
            }
        }
        
        // Xác định nếu đây là bước cuối cùng hoặc bước cập nhật thông thường
        const isCompletionStep = status.includes('thành công') || status.includes('hoàn tất') || status.includes('hoàn thành');
        const isInitialStep = status.includes('chuẩn bị') || status.includes('bắt đầu');
        
        // Chỉ các bước chính ở giữa quá trình mới cần hiển thị lâu
        const shouldStayOpen = !isCompletionStep && !isInitialStep && status.includes('xử lý');
        
        if (processingToastId) {
            toast.update(processingToastId, {
                render: status,
                type: isCompletionStep ? toast.TYPE.SUCCESS : toast.TYPE.INFO,
                ...constants.toastSettings,
                autoClose: shouldStayOpen ? false : 2000,
            });
            
            // Nếu là bước hoàn thành, đặt lịch xóa ID toast sau khi nó tự đóng
            if (isCompletionStep || !shouldStayOpen) {
                setTimeout(() => {
                    setProcessingToastId(null);
                }, 2000);
            }
        } else {
            const id = toast.info(status, {
                ...constants.toastSettings,
                autoClose: shouldStayOpen ? false : 2000,
            });
            setProcessingToastId(id);
            
            // Chỉ lưu ID nếu thông báo sẽ mở lâu
            if (!shouldStayOpen) {
                setTimeout(() => {
                    setProcessingToastId(null);
                }, 2000);
            }
        }
    };

    const handleAfterLogin = (userInfo) => {
        setIsShowModal(false);
        setUser(userInfo.user);

        toast.dismiss();
        toast.success("Login successfully", {
            ...constants.toastSettings,
        });
    };

    const handleTriggerUploadFile = () => {
        fileRef.current.click();
    };

    const handleSelectFile = async (e) => {
        const { files } = e.target;
        if (files?.length) {
            processSelectedFile(files[0]);
        }
    };

    const handleDragOver = (e) => {
        // Ngăn chặn hành động mặc định của thẻ HTML để cho phép thả file vào
        e.preventDefault();
    };

    const handleSelectFileFromDrop = async (e) => {
        e.preventDefault();
        const { files } = e.dataTransfer;
        if (files?.length) {
            processSelectedFile(files[0]);
        }
    };

    const handleUploadFile = () => {
        const fileType = file.type.includes("image") ? "image" : "video";
        if (file) {
            setIsUploading(true);
            
            // Hiển thị thông báo upload đang tiến hành
            toast.info(`Uploading ${fileType}...`, {
                ...constants.toastSettings,
                autoClose: false,
                toastId: 'uploading'
            });
            
            lockerService
                .uploadMedia(file, caption, showToastPleaseWait)
                .then((res) => {
                    if (res) {
                        setPreviewUrl("");
                        setFile(null);
                        setCaption("");
                        setIsUploading(false);

                        toast.dismiss('uploading');
                        toast.success(`Upload ${fileType} successfully`, {
                            ...constants.toastSettings,
                        });
                    }
                })
                .catch((error) => {
                    let message = error.userMessage || 
                        error?.response?.data?.error?.message ||
                        error.message ||
                        "Upload failed";

                    if (message === "Failed to upload image: Forbidden") {
                        message = `Your ${fileType} is exceeding the maximum size allowed, please try again with a smaller ${fileType}`;
                    }
                    
                    setIsUploading(false);
                    toast.dismiss('uploading');
                    toast.error(message, {
                        ...constants.toastSettings,
                        autoClose: 5000
                    });
                });
        }
    };

    const showToastPleaseWait = () => {
        toast.dismiss();
        toast.info(
            "I just migrated the server to Render at the free version, so the request may take a longer time. Please wait for it. ",
            {
                ...constants.toastSettings,
            },
        );
    };

    // Xử lý ảnh sau khi đã crop
    const handleImageCropped = async (croppedFile) => {
        try {
            setShowCropper(false);
            setIsUploading(true);
            setProcessingStatus("Đang xử lý ảnh đã crop...");
            
            // Hiển thị toast thông báo đang xử lý
            const toastId = toast.info("Đang xử lý ảnh đã crop...", {
                ...constants.toastSettings,
                autoClose: false,
            });
            setProcessingToastId(toastId);
            
            // Xử lý file đã crop với hàm callback cập nhật trạng thái
            const processedFile = await miscFuncs.processMedia(croppedFile, updateProcessingStatus);
            
            const objectUrl = URL.createObjectURL(processedFile);
            setFile(processedFile);
            setPreviewUrl(objectUrl);
            
            // Thông báo hoàn tất xử lý file
            toast.update(toastId, {
                render: `Đã xử lý ảnh thành công: ${(processedFile.size/1024/1024).toFixed(2)}MB`,
                type: toast.TYPE.SUCCESS,
                ...constants.toastSettings,
                autoClose: 3000,
            });
            
            setProcessingToastId(null);
            setIsUploading(false);
            setOriginalFile(null);
        } catch (error) {
            if (processingToastId) {
                toast.dismiss(processingToastId);
            }
            toast.error(error.message, {
                ...constants.toastSettings,
            });
            setProcessingToastId(null);
            setIsUploading(false);
            setOriginalFile(null);
        }
    };
    
    // Hủy quá trình crop ảnh
    const handleCancelCrop = () => {
        setShowCropper(false);
        setOriginalFile(null);
        setIsUploading(false);
    };

    // Chuẩn bị file ảnh để crop
    const prepareImageForCrop = (imageFile) => {
        setOriginalFile(imageFile);
        setShowCropper(true);
    };

    // Xử lý file sau khi chọn
    const processSelectedFile = async (selectedFile) => {
        // Nếu là ảnh, hiển thị cropper trước
        if (selectedFile.type.includes('image')) {
            prepareImageForCrop(selectedFile);
            return;
        }
        
        // Nếu là video, xử lý bình thường
        try {
            setIsUploading(true);
            setProcessingStatus("Đang chuẩn bị xử lý video...");
            
            // Hiển thị toast thông báo đang xử lý
            const toastId = toast.info("Đang chuẩn bị xử lý video...", {
                ...constants.toastSettings,
                autoClose: false,
            });
            setProcessingToastId(toastId);
            
            // Xử lý file với hàm callback cập nhật trạng thái
            const processedFile = await miscFuncs.processMedia(selectedFile, updateProcessingStatus);
            
            const objectUrl = URL.createObjectURL(processedFile);
            setFile(processedFile);
            setPreviewUrl(objectUrl);
            
            // Thông báo hoàn tất xử lý file
            toast.update(toastId, {
                render: `Đã xử lý video thành công: ${(processedFile.size/1024/1024).toFixed(2)}MB`,
                type: toast.TYPE.SUCCESS,
                ...constants.toastSettings,
                autoClose: 3000,
            });
            
            setProcessingToastId(null);
            setIsUploading(false);
        } catch (error) {
            if (processingToastId) {
                toast.dismiss(processingToastId);
            }
            toast.error(error.message, {
                ...constants.toastSettings,
            });
            setProcessingToastId(null);
            setIsUploading(false);
        }
    };

    return (
        <div className={cx("wrapper")}>
            <div className={cx("card")}>
                {user ? (
                    <>
                        <h2 className={cx("title")}>Upload image or video</h2>
                        <div className={cx("input-container")}>
                            <input
                                type="text"
                                className={cx("post-title")}
                                placeholder="Enter the title for your post"
                                value={caption}
                                onChange={(e) => setCaption(e.target.value)}
                            />
                        </div>
                        
                        {/* Hiển thị trạng thái xử lý nếu đang xử lý */}
                        {isUploading && processingStatus && (
                            <div className={cx("processing-status")}>
                                <div className={cx("status-text")}>{processingStatus}</div>
                                <div className={cx("progress-bar")}>
                                    <div 
                                        className={cx("progress", { indeterminate: processingProgress === 0 })}
                                        style={{ width: processingProgress > 0 ? `${processingProgress}%` : undefined }}
                                    ></div>
                                </div>
                            </div>
                        )}
                        
                        <div
                            className={cx("upload-area")}
                            onDragOver={handleDragOver}
                            onDrop={handleSelectFileFromDrop}
                            role="button"
                            tabIndex="0"
                        >
                            {previewUrl ? (
                                <div className={cx("preview-wrapper")}>
                                    {file.type.includes("image") ? (
                                        <img
                                            src={previewUrl}
                                            alt="preview"
                                            className={cx("preview-image")}
                                        />
                                    ) : (
                                        <video
                                            src={previewUrl}
                                            alt="preview"
                                            className={cx("preview-video")}
                                            controls
                                        >
                                            <track
                                                kind="captions"
                                                src="captions.vtt"
                                                label="English"
                                            />
                                        </video>
                                    )}
                                    <button
                                        className={cx("btn-delete-preview")}
                                        onClick={() => setPreviewUrl("")}
                                    >
                                        <span>x</span>
                                    </button>
                                </div>
                            ) : (
                                <div className={cx("content")}>
                                    <button onClick={handleTriggerUploadFile}>
                                        <img
                                            src={images.mediaUpload}
                                            alt="upload"
                                            className={cx("upload-icon")}
                                        />
                                    </button>
                                    <h3>
                                        Drag and Drop file here or{" "}
                                        <button
                                            className={cx("underline")}
                                            onClick={handleTriggerUploadFile}
                                        >
                                            Choose file
                                        </button>
                                        <input
                                            type="file"
                                            ref={fileRef}
                                            onChange={handleSelectFile}
                                            accept="image/*,video/*"
                                        />
                                    </h3>
                                    <p className={cx("paste-hint")}>
                                        Hoặc <kbd>Ctrl</kbd>+<kbd>V</kbd> để dán ảnh trực tiếp từ clipboard
                                    </p>
                                </div>
                            )}
                        </div>
                        <div className={cx("actions")}>
                            <Help />
                            <div className={cx("buttons")}>
                                <button onClick={() => setPreviewUrl("")}>
                                    Cancel
                                </button>
                                <button
                                    disabled={
                                        previewUrl && caption && !isUploading
                                            ? ""
                                            : "disable"
                                    }
                                    className={cx("btn-submit", {
                                        "is-loading": isUploading,
                                    })}
                                    onClick={handleUploadFile}
                                >
                                    <span>Submit</span>
                                    {isUploading && (
                                        <img
                                            src={images.spinner}
                                            alt="spinner"
                                            className={cx("spinner")}
                                        />
                                    )}
                                </button>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className={cx("no-login")}>
                        <h3>Please login to upload image or video</h3>
                        <button
                            className={cx("btn-login")}
                            onClick={() => setIsShowModal(true)}
                        >
                            Login here
                        </button>
                        <LoginModal
                            handleAfterLogin={handleAfterLogin}
                            show={isShowModal}
                            onHide={() => setIsShowModal(false)}
                            onPleaseWait={showToastPleaseWait}
                        />
                    </div>
                )}
            </div>
            {showCropper && originalFile && (
                <div className={cx("cropper-modal")}>
                    <div className={cx("cropper-overlay")}></div>
                    <div className={cx("cropper-content")}>
                        <ImageCropper
                            imageFile={originalFile}
                            onImageCropped={handleImageCropped}
                            onCancel={handleCancelCrop}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default Upload;
