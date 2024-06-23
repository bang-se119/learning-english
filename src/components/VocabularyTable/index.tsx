"use client";

import React, { useContext, useEffect, useRef, useState } from 'react';
import type { GetRef, InputRef } from 'antd';
import { Button, Form, Input, Table } from 'antd';
import "./index.module.css"
import _ from "lodash"

type FormInstance<T> = GetRef<typeof Form<T>>;

const EditableContext = React.createContext<FormInstance<any> | null>(null);

interface Item {
    key: string;
    name: string;
    age: string;
    address: string;
}

interface EditableRowProps {
    index: number;
}

const EditableRow: React.FC<EditableRowProps> = ({ index, ...props }) => {
    const [form] = Form.useForm();
    return (
        <Form form={form} component={false}>
            <EditableContext.Provider value={form}>
                <tr {...props} />
            </EditableContext.Provider>
        </Form>
    );
};

interface EditableCellProps {
    title: React.ReactNode;
    editable: boolean;
    dataIndex: keyof Item;
    record: Item;
    handleSave: (record: Item) => void;
}

const EditableCell: React.FC<React.PropsWithChildren<EditableCellProps>> = ({
    title,
    editable,
    children,
    dataIndex,
    record,
    handleSave,
    ...restProps
}) => {
    const [editing, setEditing] = useState(false);
    const inputRef = useRef<InputRef>(null);
    const form = useContext(EditableContext)!;

    useEffect(() => {
        if (editing) {
            inputRef.current?.focus();
        }
    }, [editing]);

    const toggleEdit = () => {
        setEditing(!editing);
        form.setFieldsValue({ [dataIndex]: record[dataIndex] });
    };

    const save = async () => {
        try {
            const values = await form.validateFields();
            const editedData = { ...record, ...values };
            const listFromStorage = window.localStorage.getItem("vocabularies");
            if(listFromStorage) {
                let arrayList = JSON.parse(listFromStorage);
                const indexFind = _.findIndex(arrayList, (e: any) => e.key === editedData.key);
                arrayList[indexFind] = editedData;
                window.localStorage.setItem('vocabularies', JSON.stringify(arrayList));
            }

            toggleEdit();
            handleSave(editedData);
        } catch (errInfo) {
            console.log('Save failed:', errInfo);
        }
    };

    let childNode = children;

    if (editable) {        
        childNode = editing ? (
            <Form.Item
                style={{ margin: 0 }}
                name={dataIndex}
                rules={[
                    {
                        required: true,
                        message: `${title} is required.`,
                    },
                ]}
            >
                <Input ref={inputRef} onPressEnter={save} onBlur={save} />
            </Form.Item>
        ) : (
            <div className="editable-cell-value-wrap" style={{ paddingRight: 24 }} onClick={toggleEdit}>
                {children}
            </div>
        );
    }

    return <td {...restProps}>{childNode}</td>;
};

type EditableTableProps = Parameters<typeof Table>[0];

interface DataType {
    key: React.Key;
    stt: string;
    vocabulary: string;
    type: string;
    meaning: string;
}

type ColumnTypes = Exclude<EditableTableProps['columns'], undefined>;

const VocabularyTable: React.FC = () => {
    const [dataSource, setDataSource] = useState<DataType[]>([]);

    const [count, setCount] = useState(2);

    const handleDelete = (key: React.Key) => {
        const newData = dataSource.filter((item) => item.key !== key);
        setDataSource(newData);
    };

    const defaultColumns: (ColumnTypes[number] & { editable?: boolean; dataIndex: string })[] = [
        {
            title: 'STT',
            dataIndex: 'stt',
            width: '5%',
            editable: false,
        },
        {
            title: 'Vocabulary',
            dataIndex: 'vocabulary',
            width: '30%',
            editable: true
        },
        {
            title: 'Type',
            dataIndex: 'type',
            width: '5%',
            editable: true
        },
        {
            title: 'Meaning',
            dataIndex: 'meaning',
            editable: true,
        },
    ];

    const handleAdd = () => {
        let listFromStorage: any[] = [];
        const wordListStorage = window.localStorage.getItem("vocabularies");
        if(wordListStorage) {
            listFromStorage = JSON.parse(wordListStorage);
        }

        const newData: DataType = {
            key: window.crypto.randomUUID(),
            stt: `${listFromStorage.length + 1}`,
            vocabulary: 'word',
            type: 'n',
            meaning: 'mean',
        };
        
        if(!wordListStorage) {
            window.localStorage.setItem('vocabularies', JSON.stringify([...dataSource, newData]));
        } else {
            listFromStorage.push(newData);
            window.localStorage.setItem('vocabularies', JSON.stringify(listFromStorage));
        }
        setDataSource([...dataSource, newData]);
        setCount(count + 1);
    };

    const handleSave = (row: DataType) => {
        const newData = [...dataSource];
        const index = newData.findIndex((item) => row.key === item.key);
        const item = newData[index];
        newData.splice(index, 1, {
            ...item,
            ...row,
        });
        setDataSource(newData);
    };

    const components = {
        body: {
            row: EditableRow,
            cell: EditableCell,
        },
    };

    const columns = defaultColumns.map((col) => {
        if (!col.editable) {
            return col;
        }
        return {
            ...col,
            onCell: (record: DataType) => ({
                record,
                editable: col.editable,
                dataIndex: col.dataIndex,
                title: col.title,
                handleSave,
            }),
        };
    });

    useEffect(() => {
        const wordListStorage = window.localStorage.getItem("vocabularies");
        if(wordListStorage) {
            setDataSource(JSON.parse(wordListStorage));
        } 
    }, [])

    return (
        <div>
            <Button onClick={handleAdd} type="primary" style={{ marginBottom: 16 }}>
                Add new word
            </Button>
            <Table
                components={components}
                rowClassName={() => 'editable-row'}
                bordered
                dataSource={dataSource}
                columns={columns as ColumnTypes}
            />
        </div>
    );
};

export default VocabularyTable;