import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, Plus, Cloud, FileText, FileSpreadsheet, FileImage, File, Download, Trash2, Folder, HardDrive, Share2, Star, Loader2, Upload, X, FolderPlus, MoreVertical } from 'lucide-react';
import { DriveItem } from '../types';
import { driveService } from '../services/driveService';

/**
 * DriveView 컴포넌트
 * 
 * 파일 관리 기능을 제공하는 드라이브 뷰입니다.
 * 
 * 주요 기능:
 * - 파일 목록 조회 (Supabase Storage 연동)
 * - 파일 업로드 (버튼 클릭 + 드래그앤드롭)
 * - 파일 다운로드/삭제
 * - 즐겨찾기 기능
 * - 파일 검색
 */

const DriveView: React.FC = () => {
    // 파일 목록
    const [files, setFiles] = useState<DriveItem[]>([]);
    // 로딩 상태
    const [loading, setLoading] = useState(true);
    // 선택된 파일
    const [selectedFile, setSelectedFile] = useState<DriveItem | null>(null);
    // 현재 뷰 모드
    const [viewMode, setViewMode] = useState<'my' | 'shared' | 'starred' | 'trash'>('my');
    // 업로드 중 상태
    const [uploading, setUploading] = useState(false);
    // 업로드 진행률
    const [uploadProgress, setUploadProgress] = useState(0);
    // 드래그 오버 상태
    const [isDragOver, setIsDragOver] = useState(false);
    // 검색어
    const [searchTerm, setSearchTerm] = useState('');

    // 파일 입력 ref
    const fileInputRef = useRef<HTMLInputElement>(null);
    // 드롭존 ref
    const dropZoneRef = useRef<HTMLDivElement>(null);

    /**
     * Supabase Storage에서 파일 목록을 가져옵니다.
     */
    const fetchFiles = async () => {
        setLoading(true);
        const { data, error } = await driveService.getFiles();
        if (error) {
            console.error('파일 목록 불러오기 실패:', error);
        } else {
            setFiles(data || []);
        }
        setLoading(false);
    };

    // 컴포넌트 마운트 시 파일 로드
    useEffect(() => {
        fetchFiles();
    }, []);

    /**
     * 파일 업로드 처리
     */
    const handleFileUpload = async (filesToUpload: FileList | File[]) => {
        if (!filesToUpload || filesToUpload.length === 0) return;

        setUploading(true);
        setUploadProgress(0);

        const fileArray = Array.from(filesToUpload);
        let uploadedCount = 0;

        for (const file of fileArray) {
            try {
                const { data, error } = await driveService.uploadFile(file);
                if (error) {
                    console.error('파일 업로드 실패:', file.name, error);
                    alert(`파일 '${file.name}' 업로드에 실패했습니다.`);
                } else {
                    uploadedCount++;
                }
                // 진행률 업데이트
                setUploadProgress(Math.round((uploadedCount / fileArray.length) * 100));
            } catch (error) {
                console.error('업로드 오류:', error);
            }
        }

        // 완료 후 목록 새로고침
        await fetchFiles();
        setUploading(false);
        setUploadProgress(0);

        if (uploadedCount > 0) {
            alert(`${uploadedCount}개의 파일이 업로드되었습니다.`);
        }

        // 파일 입력 초기화
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    /**
     * 파일 입력 변경 핸들러
     */
    const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files) {
            handleFileUpload(event.target.files);
        }
    };

    /**
     * 드래그 앤 드롭 핸들러들
     */
    const handleDragEnter = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        // 드롭존 외부로 나갔을 때만 상태 변경
        if (dropZoneRef.current && !dropZoneRef.current.contains(e.relatedTarget as Node)) {
            setIsDragOver(false);
        }
    }, []);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(false);

        const droppedFiles = e.dataTransfer.files;
        if (droppedFiles && droppedFiles.length > 0) {
            handleFileUpload(droppedFiles);
        }
    }, []);

    /**
     * 파일 삭제
     */
    const handleDelete = async () => {
        if (!selectedFile) return;
        if (window.confirm(`'${selectedFile.name}' 파일을 삭제하시겠습니까?`)) {
            const { error } = await driveService.deleteFile(selectedFile.name);
            if (error) {
                alert('삭제에 실패했습니다.');
            } else {
                setFiles(files.filter(f => f.id !== selectedFile.id));
                setSelectedFile(null);
            }
        }
    };

    /**
     * 파일 다운로드
     */
    const handleDownload = () => {
        if (!selectedFile) return;
        const url = driveService.getPublicUrl(selectedFile.name);
        window.open(url, '_blank');
    };

    /**
     * 파일 타입별 아이콘 반환
     */
    const getFileIcon = (type: string, size?: number) => {
        const props = size ? { size } : {};
        
        if (type?.includes('pdf')) return <FileText className="text-red-500" {...props} />;
        if (type?.includes('sheet') || type?.includes('excel') || type?.includes('xls')) return <FileSpreadsheet className="text-green-500" {...props} />;
        if (type?.includes('word') || type?.includes('document') || type?.includes('doc')) return <FileText className="text-blue-500" {...props} />;
        if (type === 'folder') return <Folder className="text-yellow-500 fill-yellow-100" {...props} />;
        if (type?.includes('zip') || type?.includes('compressed')) return <File className="text-purple-500" {...props} />;
        if (type?.includes('image')) return <FileImage className="text-orange-500" {...props} />;
        if (type?.includes('presentation') || type?.includes('powerpoint') || type?.includes('ppt')) return <FileImage className="text-orange-500" {...props} />;

        return <File className="text-gray-400" {...props} />;
    };

    /**
     * 필터링된 파일 목록
     */
    const filteredFiles = files.filter(file => {
        // 검색어 필터
        if (searchTerm && !file.name.toLowerCase().includes(searchTerm.toLowerCase())) {
            return false;
        }
        // 뷰 모드 필터
        if (viewMode === 'starred') return file.isStarred;
        // 다른 뷰는 현재 지원하지 않으므로 기본 파일 표시
        return true;
    });

    return (
        <div 
            className="flex h-[calc(100vh-140px)] bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200"
            ref={dropZoneRef}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
        >

            {/* ========================================
                좌측 사이드바
            ======================================== */}
            <div className="w-64 bg-gray-50 border-r border-gray-200 flex flex-col p-4">
                {/* 파일 업로드 버튼 */}
                <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    onChange={handleFileInputChange}
                    multiple
                />
                <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg shadow-sm transition-colors mb-6 flex items-center justify-center gap-2 transform active:scale-95 duration-150 disabled:bg-blue-400 disabled:cursor-not-allowed"
                >
                    {uploading ? (
                        <>
                            <Loader2 className="animate-spin" size={18} />
                            업로드 중... {uploadProgress}%
                        </>
                    ) : (
                        <>
                            <Upload size={18} /> 파일 업로드
                        </>
                    )}
                </button>

                {/* 네비게이션 */}
                <nav className="space-y-1 flex-1">
                    <button
                        onClick={() => { setViewMode('my'); setSelectedFile(null); }}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${viewMode === 'my' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:bg-gray-200'}`}
                    >
                        <HardDrive size={18} /> 내 드라이브
                    </button>
                    <button
                        onClick={() => { setViewMode('starred'); setSelectedFile(null); }}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${viewMode === 'starred' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:bg-gray-200'}`}
                    >
                        <Star size={18} /> 중요 파일
                    </button>
                    <button
                        onClick={() => { setViewMode('shared'); setSelectedFile(null); }}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${viewMode === 'shared' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:bg-gray-200'}`}
                    >
                        <Share2 size={18} /> 공유 문서함
                    </button>
                    <button
                        onClick={() => { setViewMode('trash'); setSelectedFile(null); }}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${viewMode === 'trash' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:bg-gray-200'}`}
                    >
                        <Trash2 size={18} /> 휴지통
                    </button>
                </nav>

                {/* 저장 공간 */}
                <div className="mt-auto bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                    <div className="flex items-center gap-2 mb-2 text-slate-800 font-bold text-sm">
                        <Cloud size={16} /> 저장 공간
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2 mb-2">
                        <div className="bg-blue-500 h-2 rounded-full w-[15%]"></div>
                    </div>
                    <p className="text-xs text-slate-500">{files.length}개 파일 업로드됨</p>
                </div>
            </div>

            {/* ========================================
                메인 파일 영역
            ======================================== */}
            <div className="flex-1 flex flex-col min-w-0 bg-white relative">
                {/* 드래그 앤 드롭 오버레이 */}
                {isDragOver && (
                    <div className="absolute inset-0 z-50 bg-blue-500/10 border-4 border-dashed border-blue-500 rounded-lg flex items-center justify-center backdrop-blur-sm">
                        <div className="text-center">
                            <Upload size={64} className="text-blue-500 mx-auto mb-4 animate-bounce" />
                            <p className="text-xl font-bold text-blue-700">파일을 여기에 놓으세요</p>
                            <p className="text-sm text-blue-500 mt-2">드래그한 파일이 업로드됩니다</p>
                        </div>
                    </div>
                )}

                {/* 헤더 */}
                <div className="h-16 border-b border-gray-200 flex items-center justify-between px-6 shrink-0">
                    <h2 className="font-bold text-lg text-slate-800">
                        {viewMode === 'my' ? '내 드라이브' : 
                         viewMode === 'shared' ? '공유 문서함' : 
                         viewMode === 'starred' ? '중요 파일' : '휴지통'}
                    </h2>
                    <div className="flex items-center gap-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
                            <input 
                                type="text" 
                                placeholder="파일 검색" 
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-9 pr-4 py-2 bg-gray-100 rounded-lg text-sm w-64 focus:outline-none focus:ring-1 focus:ring-blue-500" 
                            />
                        </div>
                    </div>
                </div>

                {/* 파일 목록 */}
                <div className="flex-1 overflow-y-auto p-6">
                    {loading ? (
                        <div className="flex justify-center items-center h-full">
                            <Loader2 className="animate-spin text-blue-500" size={48} />
                        </div>
                    ) : filteredFiles.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-slate-400">
                            <div className="w-32 h-32 bg-gray-100 rounded-2xl flex items-center justify-center mb-6">
                                <Cloud size={64} className="text-gray-300" />
                            </div>
                            <p className="text-lg font-bold text-slate-600 mb-2">파일이 없습니다</p>
                            <p className="text-sm text-slate-400 mb-6">파일을 업로드하거나 드래그하여 추가하세요</p>
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="px-6 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors flex items-center gap-2"
                            >
                                <Upload size={18} /> 파일 업로드하기
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {filteredFiles.map(file => (
                                <div
                                    key={file.id}
                                    onClick={() => setSelectedFile(file)}
                                    className={`p-4 border rounded-xl cursor-pointer transition-all flex flex-col hover:shadow-md group relative
                                        ${selectedFile?.id === file.id ? 'border-blue-500 bg-blue-50/20 ring-1 ring-blue-500' : 'border-gray-200 bg-white hover:border-blue-300'}
                                    `}
                                >
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="w-12 h-12 bg-gray-50 rounded-lg flex items-center justify-center">
                                            {getFileIcon(file.mimeType || file.type, 24)}
                                        </div>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); /* 즐겨찾기 토글 */ }}
                                            className={`p-1 rounded transition-colors ${file.isStarred ? 'text-yellow-400' : 'text-gray-300 hover:text-yellow-400 opacity-0 group-hover:opacity-100'}`}
                                        >
                                            <Star size={16} className={file.isStarred ? 'fill-yellow-400' : ''} />
                                        </button>
                                    </div>
                                    <h4 className="font-bold text-slate-800 text-sm mb-1 truncate" title={file.name}>
                                        {file.name}
                                    </h4>
                                    <p className="text-xs text-slate-500">
                                        {file.size} • {file.modified || file.date}
                                    </p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* ========================================
                우측 상세 패널
            ======================================== */}
            {selectedFile && (
                <div className="w-80 bg-gray-50 border-l border-gray-200 flex flex-col animate-fade-in shadow-xl z-10">
                    <div className="p-6 border-b border-gray-200 bg-white flex justify-between items-center">
                        <span className="font-bold text-slate-700">상세 정보</span>
                        <button 
                            onClick={() => setSelectedFile(null)} 
                            className="text-slate-400 hover:text-slate-600 p-1 hover:bg-gray-100 rounded transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>
                    <div className="p-6 flex-1 overflow-y-auto">
                        {/* 파일 아이콘 */}
                        <div className="flex flex-col items-center mb-8">
                            <div className="w-24 h-24 bg-white rounded-2xl border border-gray-200 flex items-center justify-center shadow-sm mb-4">
                                {getFileIcon(selectedFile.mimeType || selectedFile.type, 48)}
                            </div>
                            <h3 className="text-center font-bold text-slate-800 break-all px-4">
                                {selectedFile.name}
                            </h3>
                        </div>

                        {/* 파일 정보 */}
                        <div className="space-y-6">
                            <div>
                                <label className="text-xs font-bold text-slate-400 uppercase block mb-1">파일 형식</label>
                                <p className="text-sm font-medium text-slate-700 uppercase">
                                    {selectedFile.mimeType || selectedFile.type}
                                </p>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-400 uppercase block mb-1">크기</label>
                                <p className="text-sm font-medium text-slate-700">{selectedFile.size}</p>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-400 uppercase block mb-1">소유자</label>
                                <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-[10px] font-bold text-blue-700">
                                        {selectedFile.owner ? selectedFile.owner[0] : '나'}
                                    </div>
                                    <p className="text-sm font-medium text-slate-700">{selectedFile.owner || '나'}</p>
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-400 uppercase block mb-1">수정일</label>
                                <p className="text-sm font-medium text-slate-700">{selectedFile.modified || selectedFile.date}</p>
                            </div>
                        </div>
                    </div>

                    {/* 액션 버튼 */}
                    <div className="p-4 border-t border-gray-200 bg-white flex flex-col gap-2">
                        <button
                            onClick={handleDownload}
                            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg shadow-sm transition-colors"
                        >
                            <Download size={18} /> 다운로드
                        </button>
                        <button
                            onClick={handleDelete}
                            className="w-full flex items-center justify-center gap-2 bg-red-100 hover:bg-red-200 text-red-600 font-bold py-3 rounded-lg transition-colors"
                        >
                            <Trash2 size={18} /> 삭제
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DriveView;
