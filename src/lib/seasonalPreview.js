// Session-only guard: preview games must never write account progression or history.
let preview = false;
export const isSeasonalPreview = () => preview;
export const setSeasonalPreview = value => { preview = value; };
