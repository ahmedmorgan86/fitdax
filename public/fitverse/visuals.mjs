// Project-owned, generated illustrations. Keep this provenance separate from source photographs.
export const illustrations={
 Kettlebell_Halo:'media/generated/kettlebell-halo.png',
 Kettlebell_Halo_With_Overhead_Extension:'media/generated/kettlebell-halo-extension.png',
 Kettlebell_Overhead_Triceps_Extension:'media/generated/kettlebell-triceps-extension.png'
};
export const foundationIllustrations={squat:'media/generated/chair-squat.png',wall:'media/generated/wall-pushup.png',bird:'media/generated/bird-dog.png',march:'media/generated/marching.png'};
export function pictures(entry,imageBase){return illustrations[entry.id]?[illustrations[entry.id]]:entry.images.map(p=>imageBase+p)}
export function stepsFor(entry,locale,language,override={}){const text=language==='ar'?override.arBody:override.enBody;if(text?.trim())return text.split('\n').map(s=>s.trim()).filter(Boolean);return language==='ar'?(locale.entries[entry.id]?.steps||[]):entry.instructions}
