export interface ReportData {
  places: Array<{
    id: string;
    displayName?: string;
    formattedAddress?: string;
    types?: string[];
  }>;
  ads: Array<{
    id: string;
    page_id: string;
    page_name: string;
    ad_creative_bodies?: string[];
    ad_creative_link_titles?: string[];
    ad_creative_link_descriptions?: string[];
    ad_delivery_start_time?: string;
    ad_delivery_stop_time?: string;
    ad_snapshot_url?: string;
  }>;
  analyses: Array<{
    adKey: string;
    pageName: string;
    bledy: Array<{ kategoria: string; opis: string }>;
    rekomendacja: string;
  }>;
  errors?: string[];
}
