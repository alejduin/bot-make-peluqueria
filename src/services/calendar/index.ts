import { format, addMinutes, parse, isValid } from 'date-fns'
import { MAKE_ADD_TO_CALENDAR, MAKE_GET_FROM_CALENDAR } from 'src/config'

/**
 * get calendar
 * @returns 
 */
const getCurrentCalendar = async (): Promise<string> => {
    const dataCalendarApi = await fetch(MAKE_GET_FROM_CALENDAR)
    const json: any[] = await dataCalendarApi.json()
    const list = json.reduce((prev, current) => {

        if (!current.fecha) return prev
        const parsedDate = parse(current.fecha, 'yyyy/MM/dd HH:mm:ss', new Date());
        const valid = isValid(parsedDate);
        if (!valid) return prev

        const dateStart = format(parsedDate, 'yyyy MMMM d EEEE HH:mm')
        const dateEnd = format(addMinutes(parsedDate, 45), 'yyyy MMMM d EEEE HH:mm')

        return prev += [
            `Reserved space (not available) between the following times : ${dateStart} -- ${dateEnd}\n `
        ].join(' ')
    }, '')
    return list
}

/**
 * add to calendar
 * @param text 
 * @returns 
 */
const appToCalendar = async (text: string, phone: string) => {
    try {
        const payload = { ...JSON.parse(text), phone }
        console.log(payload)
        const dataApi = await fetch(MAKE_ADD_TO_CALENDAR, {
            method: 'POST',
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(payload)
        })
        return dataApi
    } catch (err) {
        console.log(`error: `, err)
    }
}

export { getCurrentCalendar, appToCalendar }