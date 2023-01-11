import React, { useState, useRef, useEffect } from 'react'
import FormSchedule from './FormSchedule'
import TableSchedule from './TableSchedule'
import * as constants from '../constants'
import styles from './Schedule.module.css'

const BG_CLRS = ["#eb0101", "#029911", "#4c2ec6", "#f05c66", "#e158d1", "#03a9f4", "#9e9e9e", "#ff9800"]

export default function Schedule() {
    const modeRef = useRef()
    const [mode, setMode] = useState('one-by-one')
    const [schedules, setSchedules] = useState(() => {
        const initialValue = JSON.parse(localStorage.getItem('schedules')) || []
        if (initialValue.length === 0) {
            initialValue.push(constants.DATES.reduce((acc, cur, index) => {
                acc[index] = []
                constants.LESSONS.forEach(lesson => {
                    acc[index].push(undefined)
                })
                return acc
            }, []))
        }
        return initialValue
    })
    const [indexOfCurrentSchedule, setIndexOfCurrentSchedule] = useState(schedules.length - 1)

    useEffect(() => {
        localStorage.setItem('schedules', JSON.stringify(schedules))

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

    return (
        <div>
            <div className={styles['form-group']}>
                <label>Cách thức</label>
                <select
                    ref={modeRef}
                    defaultValue="one-by-one"
                    onChange={e => setMode(e.target.value)}
                >
                    <option value="one-by-one">One by one</option>
                    <option value="all-by-one">All by one</option>
                </select>
            </div>

            <FormSchedule
                mode={mode}
                schedules={schedules}
                indexOfCurrentSchedule={indexOfCurrentSchedule}
                callbacks={{
                    setSchedules,
                    setIndexOfCurrentSchedule,
                }}
            />

            <TableSchedule columns={schedules[indexOfCurrentSchedule]} />

        </div>
    )
}
