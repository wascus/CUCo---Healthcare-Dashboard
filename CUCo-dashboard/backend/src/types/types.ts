export type ViewerContext = { viewerId: string; ownerId: string; limit?: number; cursor?: string };

export type SharedItemBase = {
  id: string;
  module: 'grief' | string;
  createdAt: string;
};

export type GriefTopicItem = SharedItemBase & {
  module: 'grief';
  kind: 'topic';
  label: string;
  stage?: string | null;
};

export type ProviderResult<T = GriefTopicItem> = {
  items: T[];
  nextCursor?: string;
};

export interface ShareProvider<T = any> {
  module: string; // 'grief'
  getSharedItems(ctx: ViewerContext): Promise<ProviderResult<T>>;
}
