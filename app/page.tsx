import { Button, Typography, Box, Container, Paper, Stack } from '@mui/material';
import { User, Settings, Bell, Calendar, HomeIcon } from 'lucide-react';

export default function HomePage() {
  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        <Typography variant="h2" component="h1" gutterBottom sx={{ color: 'primary.main', fontWeight: 700 }}>
          Welcome to FaceCloud Renew
        </Typography>
        
        <Typography variant="body1" paragraph>
          This application has been set up with Next.js, Supabase, Material UI, and Lucide React icons.
        </Typography>
        
        <Paper elevation={0} sx={{ p: 3, my: 3, borderRadius: 2, border: '1px solid #eaeaea' }}>
          <Typography variant="h5" component="h2" gutterBottom sx={{ fontWeight: 600 }}>
            Theme Configuration
          </Typography>
          <Typography variant="body2" paragraph>
            The application is using DM Sans font from Google Fonts and a custom color palette.
          </Typography>
          
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mt: 2 }}>
            <Button variant="contained" color="primary" startIcon={<User />}>
              Primary Button
            </Button>
            <Button variant="contained" color="secondary" startIcon={<Settings />}>
              Secondary Button
            </Button>
            <Button variant="outlined" color="primary" startIcon={<HomeIcon />}>
              Outlined Button
            </Button>
          </Stack>
        </Paper>
        
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mt: 4 }}>
          <Paper elevation={0} sx={{ p: 3, borderRadius: 2, border: '1px solid #eaeaea', flex: 1 }}>
            <Bell color="#305893" />
            <Typography variant="h6" sx={{ mt: 2, fontWeight: 600 }}>
              Notifications
            </Typography>
            <Typography variant="body2">
              Manage your notifications and alerts
            </Typography>
          </Paper>
          
          <Paper elevation={0} sx={{ p: 3, borderRadius: 2, border: '1px solid #eaeaea', flex: 1 }}>
            <Calendar color="#2986E2" />
            <Typography variant="h6" sx={{ mt: 2, fontWeight: 600 }}>
              Calendar
            </Typography>
            <Typography variant="body2">
              Schedule and manage appointments
            </Typography>
          </Paper>
        </Stack>
      </Box>
    </Container>
  );
}
