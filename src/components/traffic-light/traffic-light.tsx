import { cn } from '@/utils/tailwind'

type TrafficLightProps = {
  red?: boolean
  yellow?: boolean
  green?: boolean
}

export default function TrafficLight(props: TrafficLightProps) {
  const noPropsProvided =
    props.red === undefined && props.yellow === undefined && props.green === undefined

  const lights = [
    { color: 'red', isActive: noPropsProvided || props.red === true },
    { color: 'yellow', isActive: noPropsProvided || props.yellow === true },
    { color: 'green', isActive: noPropsProvided || props.green === true },
  ]

  const mapLightBg: Record<string, string> = {
    red: 'bg-[radial-gradient(50%_50%_at_50%_50%,#FF7B7B_0%,#9B0000_100%)]',
    yellow: 'bg-[radial-gradient(50%_50%_at_50%_50%,#FFF37B_0%,#B98A00_100%)]',
    green: 'bg-[radial-gradient(50%_50%_at_50%_50%,#7BFF7B_0%,#008900_100%)]',
  }

  return (
    <div className="flex gap-1">
      {lights.map((light) => (
        <div
          key={light.color}
          className="flex items-center justify-center w-16 h-14 bg-black rounded-[0.25rem]"
        >
          {light.isActive && (
            <div
              className={cn(
                'rounded-full size-8  transition-opacity duration-200',
                mapLightBg[light.color],
              )}
            />
          )}
        </div>
      ))}
    </div>
  )
}
