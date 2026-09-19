export const loadoutFiles={original:'team-data.json','storm-score':'team-score-data.json',balanced:'team-balanced-data.json'};
export function loadoutKey(value,fallback='storm-score'){return Object.hasOwn(loadoutFiles,value)?value:fallback;}
