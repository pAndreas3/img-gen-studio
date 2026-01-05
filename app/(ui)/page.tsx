import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getModelsByUserId } from '@/lib/model/service';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
    const session = await auth();
    
    if (session?.user?.id) {
        try {
            // Check if user has existing models
            const result = await getModelsByUserId(session.user.id);
            
            if (result.success && result.data && result.data.length > 0) {
                // User has models, redirect to models page
                redirect('/models');
            } else {
                // User has no models, redirect to train new model page
                redirect('/models/train');
            }
        } catch (error) {
            // Re-throw redirect errors (they're not actual errors)
            if (error instanceof Error && error.message === 'NEXT_REDIRECT') {
                throw error;
            }
            console.error('Error checking user models:', error);
            // On error, default to train new model page
            redirect('/models/train');
        }
    }
    
    // If not authenticated, they'll be redirected to login by the layout
    return null;
}
