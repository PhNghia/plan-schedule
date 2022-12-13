import React, { useState, useRef, useCallback, useEffect } from 'react'
import * as constants from '../../constants'
import styles from './FormSchedule.module.css'
import domtoimage from 'dom-to-image'

const MAX_LESSON_ON_DAY = 10

export default function TableSchedule({ columns }) {

    const tableScheduleRef = useRef()
    const tableContentColRef = useRef()
    const [loading, setLoading] = useState(false)
    const [heightOfRow, setHeightOfRow] = useState(0)

    const onClickButtonDownload = useCallback(async () => {
        setLoading(true)
        const dataURL = await domtoimage.toPng(tableScheduleRef.current, { quality: 1, bgcolor: "#fff" })
        const link = document.createElement('a')
        link.download = "my-plan-schedule.png"
        link.href = dataURL
        link.click()
        setLoading(false)
    }, [tableScheduleRef])

    useEffect(() => {
        function getHeightOfTableContentCol () {
            const rect = tableContentColRef.current.getBoundingClientRect()
            setHeightOfRow(rect.height / MAX_LESSON_ON_DAY)
        }

        getHeightOfTableContentCol()

        window.addEventListener('resize', getHeightOfTableContentCol)
        return () => {
            window.removeEventListener('resize', getHeightOfTableContentCol)
        }
    }, [columns])

    return (
        <div>
            <div className={styles['table']} ref={tableScheduleRef}>
                <ul className={`${styles['first-row']} ${styles['row']}`}>
                    {constants.DATES.map(date => <li key={date.value} value={date.value}>{window.innerWidth <= 350 ? date.displayMobile : date.display}</li>)}
                </ul>
                <ul className={styles['first-col']}>
                    {constants.LESSONS.map(lesson => <li key={lesson.value} value={lesson.value}>{lesson.display}</li>)}
                </ul>
                <div className={`${styles['table-content']} ${styles['row']}`}>
                    {columns.map((col, i1) => (
                        <div
                            key={i1}
                            className={styles['table-content-col']}
                            ref={tableContentColRef}
                        >
                            <ul className={styles['table-content-col-list']}>
                                {col.map((row, i2) => (
                                    <li key={i1 + "" + i2}></li>
                                ))}
                            </ul>
                            <div className={styles['table-col-range']}></div>
                            {col.reduce((acc, row) => {
                                const range = acc.find(range => range.date && row && range.lessonStart === row.lessonStart)
                                if (!range && row) {
                                    acc.push(row)
                                }
                                return acc
                            }, []).map((row) => {
                                return (
                                    <div
                                        key={row.lessonStart}
                                        style={{
                                            top: (row.lessonStart - 1) * heightOfRow + 'px',
                                            height: (row.numberLesson) * heightOfRow + 'px',
                                            width: '100%',
                                            backgroundColor: row.bgClr
                                        }}
                                        className={styles['range']}
                                    >
                                        <span>{row.name}</span>
                                        <span>Nhóm {row.group}</span>
                                    </div>
                                )
                            })}
                        </div>
                    ))}
                </div>
            </div>

            <div className={styles['export-image']}>
                <button onClick={onClickButtonDownload}>Tải ảnh <i className="fa-solid fa-download"></i></button>
                <div className={`${styles['lds-ellipsis']} ${loading && styles['loading']}`}>
                    <div></div>
                    <div></div>
                    <div></div>
                    <div></div>
                </div>
            </div>
        </div>
    )
}
