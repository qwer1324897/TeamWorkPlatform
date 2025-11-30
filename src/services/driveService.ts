import { supabase } from '../lib/supabase';
import { DriveItem } from '../types';

/**
 * driveService
 * 
 * 드라이브 파일 관리 서비스입니다.
 * 
 * 중요: 실제 파일은 Supabase Storage 대신 drive_files 테이블에 메타데이터만 저장합니다.
 * 이 방식은 시연용으로, 실제 파일 저장 없이 파일 관리 UI를 테스트할 수 있습니다.
 * 
 * 주요 기능:
 * - 파일 목록 조회 (drive_files 테이블)
 * - 파일 메타데이터 추가 (실제 업로드 시뮬레이션)
 * - 즐겨찾기 토글
 * - 파일 삭제
 */

/**
 * 파일 확장자에 따른 타입 판별
 */
function getFileType(filename: string): DriveItem['type'] {
    const ext = filename.split('.').pop()?.toLowerCase() || '';
    
    if (ext === 'pdf') return 'pdf';
    if (['doc', 'docx'].includes(ext)) return 'doc';
    if (['xls', 'xlsx', 'csv'].includes(ext)) return 'xls';
    if (['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'].includes(ext)) return 'img';
    if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) return 'zip';
    if (['ppt', 'pptx'].includes(ext)) return 'ppt';
    
    return 'file';
}

/**
 * 파일 크기 포맷팅
 */
function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export const driveService = {
    /**
     * 파일 목록 가져오기
     * drive_files 테이블에서 메타데이터 조회
     */
    async getFiles() {
        const { data, error } = await supabase
            .from('drive_files')
            .select('*')
            .order('created_at', { ascending: false });

        // DB 데이터를 DriveItem 형식으로 변환
        const files: DriveItem[] = data?.map(file => ({
            id: String(file.id),
            name: file.name || '',
            type: getFileType(file.name || ''),
            size: file.size || '-',
            owner: file.owner || '나',
            isStarred: file.is_starred || false,
            modified: file.created_at 
                ? new Date(file.created_at).toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\. /g, '-').replace('.', '')
                : '-',
            date: file.date 
                ? new Date(file.date).toLocaleDateString('ko-KR')
                : undefined
        })) || [];

        return { data: files, error };
    },

    /**
     * 파일 업로드 (메타데이터만 DB에 저장)
     * 실제 파일은 저장하지 않고 메타데이터만 기록합니다.
     * 시연용으로 파일 업로드가 성공한 것처럼 동작합니다.
     */
    async uploadFile(file: File, path: string = '') {
        // 파일 메타데이터 생성
        const fileData = {
            name: file.name,
            type: getFileType(file.name),
            size: formatFileSize(file.size),
            owner: '김태호',  // 현재 로그인한 사용자
            is_starred: false,
            path: path ? `${path}/${file.name}` : `/${file.name}`,
            date: new Date().toISOString()
        };

        // drive_files 테이블에 메타데이터 저장
        const { data, error } = await supabase
            .from('drive_files')
            .insert([fileData])
            .select()
            .single();

        if (error) {
            console.error('파일 메타데이터 저장 실패:', error);
            return { data: null, error };
        }

        // DriveItem 형식으로 변환하여 반환
        const newFile: DriveItem = {
            id: String(data.id),
            name: data.name,
            type: getFileType(data.name),
            size: data.size,
            owner: data.owner,
            isStarred: data.is_starred,
            modified: new Date().toLocaleDateString('ko-KR')
        };

        return { data: newFile, error: null };
    },

    /**
     * 폴더 생성 (메타데이터만 저장)
     */
    async createFolder(folderName: string, path: string = '') {
        const folderData = {
            name: folderName,
            type: 'folder',
            size: '-',
            owner: '김태호',
            is_starred: false,
            path: path ? `${path}/${folderName}` : `/${folderName}`,
            date: new Date().toISOString()
        };

        const { data, error } = await supabase
            .from('drive_files')
            .insert([folderData])
            .select()
            .single();

        return { data, error };
    },

    /**
     * 파일 삭제
     * drive_files 테이블에서 레코드 삭제
     */
    async deleteFile(fileNameOrId: string) {
        // ID로 삭제 시도 (숫자인 경우)
        const numericId = parseInt(fileNameOrId);
        
        if (!isNaN(numericId)) {
            const { error } = await supabase
                .from('drive_files')
                .delete()
                .eq('id', numericId);
            return { error };
        }

        // 파일명으로 삭제
        const { error } = await supabase
            .from('drive_files')
            .delete()
            .eq('name', fileNameOrId);

        return { error };
    },

    /**
     * 즐겨찾기 토글
     */
    async toggleStar(id: string | number, currentStarred: boolean) {
        const numericId = typeof id === 'string' ? parseInt(id) : id;
        
        const { data, error } = await supabase
            .from('drive_files')
            .update({ is_starred: !currentStarred })
            .eq('id', numericId)
            .select()
            .single();

        return { data, error };
    },

    /**
     * 파일 다운로드 URL 가져오기
     * 메타데이터만 저장하므로 실제 다운로드 불가
     * 시연용으로 빈 URL 반환
     */
    getPublicUrl(filePath: string): string {
        // 시연용: 실제 파일이 없으므로 경고 메시지를 위한 빈 URL
        console.log('시연 모드: 실제 파일은 저장되지 않습니다.');
        return '#';
    }
};
