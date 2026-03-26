export interface Connection {
  userId: string;
  connectedTo: string;
  createdAt: Date;
}

export interface Wave {
  id: string;
  fromUser: string;
  toUser: string;
  urlContext: string | null;
  createdAt: Date;
}
