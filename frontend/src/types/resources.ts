export interface ResourceSummary {
  slug: string;
  category: string;
  title: string;
  preview: string;
  read_time: string;
}

export interface ResourceArticle extends ResourceSummary {
  body: string[];
}