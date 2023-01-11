import React, { useState, useRef, useEffect } from 'react'
import * as constants from '../constants'
import styles from './Schedule.module.css'

const BG_CLRS = ["#eb0101", "#029911", "#4c2ec6", "#f05c66", "#e158d1", "#03a9f4", "#9e9e9e", "#ff9800"]
const SYNTAX_TH_FORMAT_SUBJECT = '01'

export default function FormSchedule({ mode, schedules, indexOfCurrentSchedule, callbacks }) {
    const codeSubjectRef = useRef()
    const nameRef = useRef()
    const groupRef = useRef()
    const numberStudyDayRef = useRef()
    const [times, setTimes] = useState([])

    const formatTextRef = useRef()

    const submitFormCallbacks = {
        'one-bye-one': handleSubmitFormForOne,
        'all-by-one': handleSubmitFormForAll
    }

    useEffect(() => {
        const autoSave = () => {
            if (document.visibilityState === 'hidden') {
                localStorage.setItem('schedules', JSON.stringify(schedules))
            }
        }

        document.addEventListener('visibilitychange', autoSave)
        return () => {
            document.removeEventListener('visibilitychange', autoSave)
        }
    }, [schedules])

    function copySchedules() {
        const newSchedules = []
        schedules.forEach(schedule => {
            const newSchedule = schedule.map(column => {
                const newColumn = column.map(row => row ? { ...row } : undefined)
                return [...newColumn]
            })
            newSchedules.push([...newSchedule])
        })
        return [...newSchedules]
    }

    function isSameSchedule(oldSchedule, newSchedule) {
        if (!(oldSchedule && oldSchedule)) {
            return false
        }
        const result = oldSchedule.every((column, index) =>
            column.every((row, index2) => {
                const newRow = newSchedule[index][index2]
                if (!(row && newRow)) return row === newRow
                const valuesRowOfOld = Object.values(row)
                const valuesRowOfNew = Object.values(newRow)
                return valuesRowOfOld.every((value, index3) => value === valuesRowOfNew[index3])
            })
        )
        return result
    }

    function isSameDateAndSameLessonStart() {
        let isSame = false
        const length = times.length
        for (let i = 0; i < length - 1; i++)
            for (let j = i + 1; j < length; j++) {
                if (times[i].date === times[j].date) {
                    const start = times[i].lessonStart
                    const end = times[i].lessonStart + times[i].numberLesson - 1
                    if (
                        (times[j].lessonStart >= start && times[j].lessonStart <= end) ||
                        (times[j].lessonStart + times[j].numberLesson - 1 >= start && times[j].lessonStart + times[j].numberLesson - 1 <= end)
                    ) {
                        alert(`Thứ tự tiết học trong ngày thứ ${times[i].date} không hợp lệ!`)
                        return true
                    }
                }
            }
        return false
    }

    function deleteSameSubject(fakeColumns, code) {
        fakeColumns.forEach((column, index) => {
            column.forEach((row, index2) => {
                if (row && row.code === code) {
                    fakeColumns[index][index2] = undefined
                }
            })
        })
    }

    function makeBackgroundColorOfRange(fakeColumns) {
        const subjects = []
        fakeColumns.forEach(column => {
            column.forEach((row) => {
                const subject = subjects.find(subject => row && subject.code === row.code)
                if (subject) {
                    row.bgClr = subject.bgClr
                    return
                }
                if (!subject && row) {
                    const color = BG_CLRS[subjects.length < BG_CLRS.length ? subjects.length : subjects.length - BG_CLRS.length]
                    subjects.push({
                        code: row.code,
                        bgClr: color
                    })
                    row.bgClr = color
                }
            })
        }, [])
    }

    function handleSubmitFormForOne(e) {
        e.preventDefault()
        const fakeColumns = copySchedules()[indexOfCurrentSchedule]
        deleteSameSubject(fakeColumns, codeSubjectRef.current.value)
        const result = {
            code: codeSubjectRef.current.value,
            name: nameRef.current.value,
            group: groupRef.current.valueAsNumber,
            numberStudyDay: numberStudyDayRef.current.valueAsNumber
        }

        if (isSameDateAndSameLessonStart()) {
            return;
        }

        times.forEach(time => {
            const newTime = {
                date: 2, // default date
                ...time
            }
            const column = fakeColumns[newTime.date - 2] // date is 2 => index of column is 2 - 2 = 0
            for (let i = 0; i < newTime.numberLesson; i++) {
                const index = newTime.lessonStart + i - 1
                if (column[index]) {
                    const code = column[index].code
                    fakeColumns.forEach((col, index2) => {
                        col.forEach((row, index3) => {
                            if (row && row.code === code) {
                                fakeColumns[index2][index3] = undefined
                            }
                        })
                    })
                }
                column[index] = { ...result, ...newTime }
            }
        })
        makeBackgroundColorOfRange(fakeColumns)
        const isSame = isSameSchedule(schedules[schedules.length - 1], fakeColumns)
        if (isSame) {
            return
        }
        callbacks.setSchedules(prev => [...prev.slice(0, indexOfCurrentSchedule + 1), fakeColumns])
        callbacks.setIndexOfCurrentSchedule(prevIndex => prevIndex + 1)
    }

    function handleSubmitFormForAll(e) {
        e.preventDefault()
        const convertArray = formatTextRef.current.value.split('DSSV\n')
        const subjectsInArray = convertArray.filter(item => {
            const codeSubject = item.slice(0, item.indexOf('\t'))
            return isNaN(parseFloat(codeSubject)) ? false : true
        })
        const timesInSubject = subjectsInArray.map(subject => {
            const convertArray = subject.split('\n')
            const info = getInfoFromSubject(convertArray[0])
            const times = getTimesFromSubject(convertArray)
            return {
                info,
                times
            }
        })
        const fakeColumns = copySchedules()[0]
        timesInSubject.forEach(subject => {
            subject.times.forEach(time => {
                const column = fakeColumns[time.date - 2]
                for (let i = 0; i < time.numberLesson; i++) {
                    const index = time.lessonStart + i - 1
                    column[index] = { ...subject.info, ...time }
                }
            })
        })
        makeBackgroundColorOfRange(fakeColumns)
        callbacks.setSchedules(prev => [...prev.slice(0, indexOfCurrentSchedule + 1), fakeColumns])
        callbacks.setIndexOfCurrentSchedule(prevIndex => prevIndex + 1)
    }

    function getInfoFromSubject (string) {
        const info = string.split('\t')
        return {
            code: info[0],
            name: info[1],
            group: info[2]
        }
    }

    function getTimesFromSubject (array) {
        const times = []
        let index = 1, count = 0, isTH = false
        while (true) {
            if (array[index] === SYNTAX_TH_FORMAT_SUBJECT) {
                isTH = true
            }
            if (parseFloat(array[index]) && array[index] !== SYNTAX_TH_FORMAT_SUBJECT) {
                if (count === 0) {
                    times[index - (times.length * 2) - (isTH ? 2 : 1)].numberLesson = parseFloat(array[index])
                } else {
                    times[index - times.length - (isTH ? 2 : 1)].lessonStart = parseFloat(array[index])
                    count--
                }
            } else {
                if (array[index].includes('.')) break;
                const date = constants.DATES.find(date => date.display.toLowerCase().includes(array[index].toLowerCase()))
                if (date) {
                    times.push({ date: date.value })
                    count++
                }
            }
            index++
        }
        return times
    }

    return (
        <div>
            <form
                className={styles['form-schedule']}
                onSubmit={submitFormCallbacks[mode]}
                onReset={(e) => {
                    e.target.reset()
                    setTimes([])
                    numberStudyDayRef.current.value = -1
                    codeSubjectRef.current.focus()
                }}
            >
                {mode === 'one-by-one' &&
                    <div>
                        <div>
                            <div className={styles['form-group']}>
                                <label htmlFor="code-input">Mã</label>
                                <input id="code-input" type="text" ref={codeSubjectRef} required />
                            </div>
                            <div className={styles['form-group']}>
                                <label htmlFor="name-input">Tên</label>
                                <input id="name-input" type="text" ref={nameRef} required />
                            </div>
                            <div className={styles['form-group']}>
                                <label htmlFor="group-input">Nhóm</label>
                                <input id="group-input" type="number" min="1" ref={groupRef} required />
                            </div>
                            <div className={styles['form-group']}>
                                <label htmlFor="number-day-input">Số ngày học</label>
                                <input
                                    id="number-day-input"
                                    type="number"
                                    min="1"
                                    max="3"
                                    required
                                    ref={numberStudyDayRef}
                                    onChange={e => {
                                        if (e.target.valueAsNumber < e.target.min || e.target.valueAsNumber > e.target.max) return;
                                        if (e.target.valueAsNumber > times.length) {
                                            for (let i = times.length; i < e.target.valueAsNumber; i++) {
                                                setTimes(times => [...times, {}])
                                            }
                                        } else {
                                            setTimes(times => [...times].splice(0, e.target.valueAsNumber))
                                        }
                                    }}
                                />
                            </div>
                        </div>
                        <div>
                            {times.map((time, index) => {
                                return (<div key={index} className={styles['form-toggle']}>
                                    <div className={styles['form-group']}>
                                        <label>Thứ</label>
                                        <select
                                            defaultValue="2"
                                            onChange={(e) => {
                                                times[index] = {
                                                    ...times[index],
                                                    date: parseInt(e.target.value)
                                                }
                                            }}
                                        >
                                            <option value="2">Hai</option>
                                            <option value="3">Ba</option>
                                            <option value="4">Tư</option>
                                            <option value="5">Năm</option>
                                            <option value="6">Sáu</option>
                                            <option value="7">Bảy</option>
                                        </select>
                                    </div>
                                    <div className={styles['form-group']}>
                                        <label>Tiết bắt đầu</label>
                                        <input
                                            type="number"
                                            min="1"
                                            max="10"
                                            required
                                            onChange={(e) => {
                                                times[index] = {
                                                    ...times[index],
                                                    lessonStart: e.target.valueAsNumber
                                                }
                                            }}
                                        />
                                    </div>
                                    <div className={styles['form-group']}>
                                        <label>Số tiết</label>
                                        <input
                                            type="number"
                                            min="1"
                                            max="3"
                                            required
                                            onChange={(e) => {
                                                times[index] = {
                                                    ...times[index],
                                                    numberLesson: e.target.valueAsNumber
                                                }
                                            }}
                                        />
                                    </div>
                                </div>)
                            })}
                        </div>
                    </div>
                }

                {mode === 'all-by-one' &&
                    <div className={styles['form-group']}>
                        <label>Văn bản theo định dạng</label>
                        <textarea ref={formatTextRef}></textarea>
                    </div>
                }

                <div className={styles['form-button']}>
                    <input type="reset" />
                    <input type="submit" />
                </div>
            </form>
            <div>
                <div className={styles['orient-arrow-container']}>
                    <div
                        className={indexOfCurrentSchedule === 0 ? styles['blocked'] : ""}
                        onClick={() => {
                            if (indexOfCurrentSchedule === 0) return
                            callbacks.setIndexOfCurrentSchedule(prev => prev - 1)
                        }}
                    >
                        <img src="https://th.bing.com/th/id/R.ea5c9a67c3907d4224616313ccba767e?rik=p%2blKsVWOgDVYBg&riu=http%3a%2f%2ficons.iconarchive.com%2ficons%2fcustom-icon-design%2fflatastic-9%2f256%2fUndo-icon.png&ehk=I2yF6VrAeNzOp1TwQ8oBRB9TXWNqn4cRNIhqOesvzQA%3d&risl=&pid=ImgRaw&r=0" alt="undo arrow" />
                    </div>
                    <div
                        className={indexOfCurrentSchedule === schedules.length - 1 ? styles['blocked'] : ""}
                        onClick={() => {
                            if (indexOfCurrentSchedule === schedules.length - 1) return
                            callbacks.setIndexOfCurrentSchedule(prev => prev + 1)
                        }}
                    >
                        <img src="https://th.bing.com/th/id/R.03d3722ab77b0f859e4665cf954fe168?rik=3M2qlkggncinbA&riu=http%3a%2f%2ficons.iconarchive.com%2ficons%2fcustom-icon-design%2fflatastic-8%2f256%2fGo-into-icon.png&ehk=JTzW1Z%2fR1lBXB8II%2bJ%2bOAQfAvhs4b6X0LKIX0WfQ5f4%3d&risl=&pid=ImgRaw&r=0" alt="redo arrow" />
                    </div>
                </div>
            </div>
        </div>
    )
}