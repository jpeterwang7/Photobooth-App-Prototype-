export type GridConfig = {
  id: string;
  columns: number;
  rows: number;
  label: string;
  photoCount: number;
  description: string;
};

export type Template = {
  id: string;
  name: string;
  backgroundColor: string;
  frameColor: string;
  frameWidth: number;
  gap: number;
  textColor: string;
  accentColor: string;
  showDate: boolean;
  showName: boolean;
  cornerRadius: number;
  hasFilmHoles: boolean;
  description: string;
};

export type OrderStatus = 'processing' | 'shipped' | 'delivered' | 'cancelled';

export type Order = {
  id: string;
  collageName: string;
  quantity: number;
  total: number;
  address: string;
  orderedAt: Date;
  estimatedDelivery: Date;
  status: OrderStatus;
};

export type PhotoCollage = {
  id: string;
  name: string;
  createdAt: Date;
  gridId: string;
  templateId: string;
  photos: string[];
};

// ── Social / Events ───────────────────────────────────────────────────────────

export type Friend = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  addedAt: Date;
};

export type EventPhoto = {
  id: string;
  userId: string;
  userName: string;
  collageId: string;
  collageName: string;
  photos: string[];
  gridId: string;
  templateId: string;
  addedAt: Date;
};

export type EventMember = {
  userId: string;
  name: string;
  joinedAt: Date;
};

export type PhotoEvent = {
  id: string;
  name: string;
  description?: string;
  createdBy: string;
  createdByName: string;
  createdAt: Date;
  eventDate?: Date;
  members: EventMember[];
  photos: EventPhoto[];
  inviteCode: string;
};

// ── Navigation ────────────────────────────────────────────────────────────────

export type AuthStackParamList = {
  Login: undefined;
  Signup: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Profile: undefined;
  Orders: undefined;
  Events: undefined;
};

export type RootStackParamList = {
  MainTabs: { screen?: keyof MainTabParamList } | undefined;
  Setup: undefined;
  Camera: {
    gridId: string;
    templateId: string;
    collageName: string;
    totalPhotos: number;
    gridPhotoCount: number;
  };
  Selection: {
    photos: string[];
    gridId: string;
    templateId: string;
    collageName: string;
    requiredCount: number;
  };
  Collage: {
    selectedPhotos: string[];
    gridId: string;
    templateId: string;
    collageName: string;
  };
  CollageDetail: {
    collageId: string;
  };
  Payment: {
    collageName: string;
    collageId?: string;
  };
  EventDetail: {
    eventId: string;
  };
};
