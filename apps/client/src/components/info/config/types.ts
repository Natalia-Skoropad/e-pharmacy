export type InfoPageSection = {
  title: string;
  content: readonly string[];
};

export type InfoPageHighlight = {
  title: string;
  text: string;
};

export type InfoPageData = {
  path: string;
  title: string;
  description: string;
  updatedAt?: string;
  highlights?: readonly InfoPageHighlight[];
  sections: readonly InfoPageSection[];
};
