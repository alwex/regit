export const uniqBy = (array, key) => {
    return array.reduce((acc, item) => {
        const found = acc.find((accItem) => {
            return accItem[key] === item[key];
        });
        if (!found) {
            acc.push(item);
        }
        return acc;
    }, []);
};
export const uniq = (array) => {
    return [...new Set(array)];
};
