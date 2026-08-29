export interface UserBasic {
  id: string;
  username: string;
  is_seller: boolean;
  profile_picture?: string | null;
}

export interface ProductBasic {
  id: string;
  name: string;
  price: number;
  image?: string | null;
}

export interface LastMessagePreview {
  id: number;
  sender_id: string;
  content: string;
  message_type: string;
  created_at: string;
}

export interface ChatRoomListItem {
  id: number;
  other_user: UserBasic;
  product?: ProductBasic | null;
  last_message?: LastMessagePreview | null;
  last_message_at?: string | null;
  unread_count: number;
}

export interface ChatRoomList {
  rooms: ChatRoomListItem[];
}

export interface ChatMessage {
  id: number;
  room_id: number;
  sender_id: string;
  sender: UserBasic;
  content: string;
  message_type: 'text' | 'image' | 'product' | 'offer';
  is_read: boolean;
  created_at: string;
}

export interface ChatMessageList {
  messages: ChatMessage[];
}
