

export enum ViewState {
  MAIN = 'MAIN',
  MAIL = 'MAIL',
  CALENDAR = 'CALENDAR',
  TODO = 'TODO',
  MEMO = 'MEMO',
  MEETING_ROOM = 'MEETING_ROOM',
  CONTACTS = 'CONTACTS',
  MEETING = 'MEETING',
  DRIVE = 'DRIVE',
  NOTICE = 'NOTICE',
  QNA = 'QNA',
  AI = 'AI',
  KANBAN = 'KANBAN'
}

export interface User {
  name: string;
  position: string;
  department: string;
}

export interface MailItem {
  id: number;
  folder?: 'inbox' | 'sent' | 'draft' | 'trash' | 'spam';
  sender: string;
  senderEmail?: string; // optional로 변경
  title: string;
  preview: string;
  content: string;
  date: string;
  isRead: boolean;
  tag?: string;
  hasAttachment: boolean;
  isVip?: boolean;
  isImportant?: boolean;
  isMentioned?: boolean;
}

export interface NoticeItem {
  id: number;
  title: string;
  author: string;
  date: string;
  views: number;
  content: string;
  isImportant?: boolean;
  hasAttachment?: boolean;
}

export interface QnaItem {
  id: number;
  category: string;
  type?: string;  // optional로 변경
  status: '접수' | '처리중' | '답변완료' | '대기중';  // '대기중' 추가
  isSecret?: boolean;  // optional로 변경
  title: string;
  content: string;
  answer?: string;
  author: string;
  date: string;
  hasAttachment?: boolean;
}

export interface TodoItem {
  id: number;
  title: string;
  description?: string;
  project: string;
  dueDate: string;
  status: '대기' | '진행중' | '완료';
  priority: '상' | '중' | '하';
  assignee: string;
  isDeleted?: boolean;  // 휴지통 기능용
}

export interface MemoItem {
  id: number;
  title: string;
  content: string;
  tags?: string[];
  updatedAt: string;
  isPinned?: boolean;
  date?: string; // 하위 호환성을 위해 남겨둠 (필요시 제거)
  group?: string; // 하위 호환성을 위해 남겨둠 (필요시 제거)
}

export interface MeetingRoomItem {
  id: number;
  name: string;
  capacity: number;
  location: string;
  equipment?: string[]; // facilities 대체 (optional)
  status?: string; // isAvailable 대체 (optional)
  currentMeeting?: any; // 구체적인 타입 정의 필요 시 수정 (optional)
  nextMeeting?: any; // 구체적인 타입 정의 필요 시 수정 (optional)
  reservations?: string[]; // 예약된 시간대 목록 (optional)
  facilities?: string[]; // 하위 호환성
  isAvailable?: boolean; // 하위 호환성
  nextAvailableTime?: string; // 다음 예약 가능 시간
}

export interface ContactItem {
  id: number;
  name: string;
  position: string;
  department: string;
  email: string;
  phone: string;
  company: string;
  group: string;
  isVip?: boolean;
}

export interface DriveItem {
  id: string;
  name: string;
  type: 'folder' | 'pdf' | 'doc' | 'xls' | 'img' | 'zip' | 'ppt' | 'file';
  size: string;
  owner: string;
  isStarred?: boolean;
  // Supabase Storage 속성
  modified?: string;
  mimeType?: string;
  rawSize?: number;
  // 하위 호환성
  date?: string;
}

export interface CalendarEvent {
  id: number;
  title: string;
  startDate: Date;
  endDate: Date;
  type: 'personal' | 'team' | 'company';
  color: string;
}

// ========================================
// 칸반 보드 관련 타입
// ========================================

export interface Project {
  id: number;
  name: string;
  description?: string;
  status: 'active' | 'completed' | 'archived';
  color: string;
  createdAt?: string;
}

export interface KanbanColumn {
  id: number;
  projectId: number;
  name: string;
  color: string;
  position: number;
  tasks?: KanbanTask[];
}

export interface KanbanTask {
  id: number;
  columnId: number;
  title: string;
  description?: string;
  assigneeId?: number;
  assignee?: ContactItem;
  dueDate?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  position: number;
  tags?: string[];
  checklist?: ChecklistItem[];
  createdAt?: string;
}

export interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
}

export interface TaskComment {
  id: number;
  taskId: number;
  authorId: number;
  author?: ContactItem;
  content: string;
  createdAt: string;
}

export interface ActivityLog {
  id: number;
  userId?: number;
  user?: ContactItem;
  actionType: string;
  targetType: string;
  targetId?: number;
  description: string;
  metadata?: Record<string, any>;
  createdAt: string;
}