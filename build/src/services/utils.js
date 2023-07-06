export const uniqBy = (array, key) => {
    return array.reduce((acc, item) => {
        const found = acc.find((accItem) => accItem[key] === item[key]);
        if (!found) {
            acc.push(item);
        }
        return acc;
    }, []);
};
