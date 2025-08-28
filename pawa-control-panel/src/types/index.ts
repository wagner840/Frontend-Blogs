export interface KeywordOpportunity {
  blog_name: string | null
  keyword: string | null
  msv: number | null
  kw_difficulty: number | null
  cpc: number | null
  competition: string | null
  search_intent: string | null
  is_used: boolean | null
  opportunity_score: number | null
  variations_count: number | null
  serp_results_count: number | null
  priority_level: string | null
}

export interface ContentPost {
  id: string
  blog_id: string
  author_id: string
  title: string
  slug: string | null
  excerpt: string | null
  content: string | null
  status: string | null
  featured_image_url: string | null
  seo_title: string | null
  seo_description: string | null
  focus_keyword: string | null
  readability_score: number | null
  seo_score: number | null
  word_count: number | null
  reading_time: number | null
  scheduled_at: string | null
  published_at: string | null
  wordpress_post_id: number | null
  created_at: string | null
  updated_at: string | null
  blogs?: {
    name: string
    domain: string
  }
  authors?: {
    name: string
    email: string
  }
}

export interface ProductionPipeline {
  id: number | null
  post_slug: string | null
  post_title: string | null
  current_stage: string | null
  assigned_to: string | null
  due_date: string | null
  priority: string | null
  notes: string | null
  created_at: string | null
  updated_at: string | null
  blog_name: string | null
  stage_order: number | null
  days_in_stage: number | null
}