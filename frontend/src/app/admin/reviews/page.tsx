import { redirect } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import ReviewsClient from './ReviewsClient';
import { requireAdmin } from '@/lib/admin-auth';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

export default async function AdminReviewsPage() {
  const adminUserId = await requireAdmin();

  // Fetch initial data (all reviews with relations)
  const { data: reviews, error } = await supabaseAdmin
    .from('reviews')
    .select(`
      id,
      product_id,
      user_id,
      order_id,
      rating,
      comment,
      created_at,
      is_deleted,
      deleted_at,
      deleted_by,
      products!inner (
        name,
        slug
      ),
      orders!inner (
        reference,
        status
      )
    `)
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) {
    console.error('[ADMIN REVIEWS] Fetch error:', error);
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Gestion des Avis Clients
        </h1>
        <p className="text-gray-600">
          Gérez les avis clients, modérez le contenu et effectuez des suppressions soft delete.
        </p>
      </div>

      <ReviewsClient 
        initialReviews={(reviews as any) || []} 
        adminUserId={adminUserId}
      />
    </div>
  );
}
