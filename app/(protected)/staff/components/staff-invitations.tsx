'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Mail, AlertCircle, CheckCircle } from 'lucide-react';
import { DataTable } from '@/components/ui/data-table';
import { formatDistanceToNow } from 'date-fns';
import { resendStaffInvitation } from '../actions';

interface StaffInvitation {
  id: string;
  email: string;
  created_at: string;
  user_metadata: {
    first_name: string;
    last_name: string;
    role: string;
  };
  last_sign_in_at: string | null;
}

interface UserProfile {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
}

interface StaffWithProfile {
  id: string;
  role: string;
  created_at: string;
  user_profiles: UserProfile;
}

export function StaffInvitations() {
  const [invitations, setInvitations] = useState<StaffInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [resendingId, setResendingId] = useState<string | null>(null);
  const { toast } = useToast();

  // Fetch invitations
  useEffect(() => {
    const fetchInvitations = async () => {
      const supabase = createClient();
      
      // Get staff added by current user who haven't signed in yet
      const { data: inviteData, error } = await supabase
        .from('staff')
        .select(`
          id,
          user_profiles!inner (
            id,
            email,
            first_name,
            last_name
          ),
          role,
          created_at
        `)
        .eq('active', true)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching invitations:', error);
        toast({
          title: 'Error',
          description: 'Failed to load staff invitations',
          variant: 'destructive',
        });
        setLoading(false);
        return;
      }
      
      // Filter and format invitations
      if (inviteData) {
        // Transform data for the table
        const transformedInvites = inviteData.map((staff: any) => ({
          id: staff.id,
          email: staff.user_profiles.email,
          created_at: staff.created_at,
          user_metadata: {
            first_name: staff.user_profiles.first_name,
            last_name: staff.user_profiles.last_name,
            role: staff.role,
          },
          last_sign_in_at: null // We'll need to fetch this from auth.users
        }));
        
        setInvitations(transformedInvites);
      }
      
      setLoading(false);
    };
    
    fetchInvitations();
  }, [toast]);

  // Handle invitation resend
  const handleResendInvitation = async (invitation: StaffInvitation) => {
    setResendingId(invitation.id);
    
    try {
      const result = await resendStaffInvitation(invitation.id);
      
      if (result.error) {
        toast({
          title: 'Error',
          description: result.error,
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Invitation Resent',
          description: `A new invitation has been sent to ${invitation.email}`,
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to resend invitation',
        variant: 'destructive',
      });
    }
    
    setResendingId(null);
  };

  // Columns for the invitation table
  const columns = [
    {
      header: 'Name',
      cell: (invitation: StaffInvitation) => (
        <div>
          <div className="font-medium">
            {invitation.user_metadata.first_name} {invitation.user_metadata.last_name}
          </div>
          <div className="text-sm text-muted-foreground">{invitation.email}</div>
        </div>
      ),
    },
    {
      header: 'Role',
      cell: (invitation: StaffInvitation) => (
        <Badge variant="outline" className="capitalize">
          {invitation.user_metadata.role}
        </Badge>
      ),
    },
    {
      header: 'Status',
      cell: (invitation: StaffInvitation) => (
        <div className="flex items-center space-x-2">
          {invitation.last_sign_in_at ? (
            <div className="flex items-center space-x-1 text-green-600">
              <CheckCircle className="h-4 w-4" />
              <span>Accepted</span>
            </div>
          ) : (
            <div className="flex items-center space-x-1 text-amber-600">
              <AlertCircle className="h-4 w-4" />
              <span>Pending</span>
            </div>
          )}
        </div>
      ),
    },
    {
      header: 'Invited',
      cell: (invitation: StaffInvitation) => (
        <div className="text-sm">
          {formatDistanceToNow(new Date(invitation.created_at), { addSuffix: true })}
        </div>
      ),
    },
    {
      header: 'Actions',
      cell: (invitation: StaffInvitation) => (
        <Button
          size="sm"
          variant="outline"
          onClick={() => handleResendInvitation(invitation)}
          disabled={!!invitation.last_sign_in_at || resendingId === invitation.id}
        >
          {resendingId === invitation.id ? (
            <>
              <Loader2 className="mr-2 h-3 w-3 animate-spin" />
              Sending...
            </>
          ) : (
            <>
              <Mail className="mr-2 h-3 w-3" />
              Resend
            </>
          )}
        </Button>
      ),
    },
  ];

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="text-xl">Staff Invitations</CardTitle>
        <CardDescription>
          Manage invitations for staff members to join your clinics
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="py-10 flex justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : invitations.length > 0 ? (
          <DataTable data={invitations} columns={columns} />
        ) : (
          <div className="py-8 text-center text-muted-foreground">
            No pending staff invitations found
          </div>
        )}
      </CardContent>
    </Card>
  );
}
