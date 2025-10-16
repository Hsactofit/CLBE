import colors from '@/lib/colors'
import {
  Input as AntDInput,
  Checkbox,
  CheckboxChangeEvent,
  ConfigProvider,
  Form,
  InputProps,
} from 'antd'
import { Text } from './Typography'
import { NamePath } from 'antd/es/form/interface'
import { RuleObject } from 'antd/es/form'

export type InputProviderProps = {
  children: React.ReactNode
}

const InputProvider = ({ children }: InputProviderProps) => {
  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: colors.brand.primary,
          colorPrimaryHover: colors.brand.primary,
        },
      }}
    >
      {children}
    </ConfigProvider>
  )
}
interface AntTextFieldProps extends InputProps {
  name: string
  label?: string
  placeholder?: string
  error?: string
  setValue?: (name: NamePath<string>, value: object | string | number | boolean | undefined) => void
  labelOnRight?: boolean | true
  labelClassName?: string | ''
  rules?: RuleObject[]
}

const getCoreInput = (props: AntTextFieldProps) => {
  switch (props.type) {
    case 'textarea': {
      return (
        <AntDInput.TextArea
          name={props.name}
          placeholder={props.placeholder}
          // onChange={(e: React.ChangeEvent<HTMLTextAreaElement>): void => {
          //   props.setValue && props.setValue(props.name, e.target.value)
          // }}
        />
      )
    }
    case 'checkbox': {
      return (
        <Checkbox
          defaultChecked={!!props?.value}
          disabled={!!props?.disabled}
          className={props?.className}
          name={props.name}
          onChange={(e: CheckboxChangeEvent) => {
            if (props.setValue) {
              props.setValue(props.name, e.target.checked)
            }
          }}
        >
          {props.label}
        </Checkbox>
      )
    }
    default:
      return (
        <>
          <AntDInput
            name={props.name}
            onChange={e => {
              if (props.setValue) {
                props.setValue(props.name, e.target.value)
              }
            }}
            placeholder={`${props.placeholder}`}
            className={`${props?.className}`}
            type={`${props?.type}`}
          />
        </>
      )
  }
}

export const AntTextField = (props: AntTextFieldProps) => {
  return (
    <InputProvider>
      {!props.labelOnRight ? (
        <>
          {props.label && <Text className="mb-2 font-bold">{props.label}</Text>}
          <Form.Item
            name={props.name}
            validateStatus={props.error ? 'error' : ''}
            help={props.error}
            rules={props?.rules || []}
          >
            {getCoreInput(props)}
          </Form.Item>
        </>
      ) : (
        <>
          <Form.Item
            name={props.name}
            validateStatus={props.error ? 'error' : ''}
            help={props.error}
            rules={props?.rules || []}
          >
            {getCoreInput(props)}
            {props.type !== 'checkbox' && props.label && (
              <Text className={`font-bold ${props?.labelClassName}`}>{props.label}</Text>
            )}
          </Form.Item>
        </>
      )}
    </InputProvider>
  )
}
