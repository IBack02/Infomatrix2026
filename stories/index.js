import { dastarkhan, dastarkhanImages } from "./dastarkhan";
import { story1, story1Images } from "./story1"; 
import { treasure, treasureImages } from "./treasure"; 
import { syrttan, syrttanImages } from "./syrttan";
export const STORIES = {
  quyrdaq:  story1,
  river:    null,
  market:   null,
  street:   null,
  koja:     syrttan,
  treasure: treasure,
  dastarkhan: dastarkhan, // ✅ новая история
};

export const STORY_IMAGES = {
  [story1.id]:   story1Images,
  [treasure.id]: treasureImages,
  [syrttan.id]:  syrttanImages,
  [dastarkhan.id]: dastarkhanImages,
};
