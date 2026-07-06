export interface Invitation {
  id: string;
  squad_id: string;
  inviter_id: string;
  invitee_email: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  created_at: Date;
  
  // Enriched properties for API responses
  inviter_name?: string;
  squad_name?: string;
}
