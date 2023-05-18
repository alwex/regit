export const uniqBy = <T>(array: T[], key: string) => {
    return array.reduce((acc: T[], item: any) => {
        const found = acc.find((accItem: any) => accItem[key] === item[key])
        if (!found) {
            acc.push(item)
        }
        return acc
    }, [])
}
