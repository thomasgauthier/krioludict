import { useEffect, useRef, useState } from "react";

export default function useStateWithOnChange<T>(initial: T | null, onChange: (current: T | null, last: T | null) => unknown, comparator?: (current: T | null, last: T | null) => boolean): [T | null, React.Dispatch<React.SetStateAction<T | null>>] {
    const last = useRef<T | null>(null);

    const [state, setState] = useState<T | null>(initial || null);

    useEffect(() => {

        function compare(current: T | null, last: T | null) {
            if (comparator) {
                return comparator(current, last)
            } else {
                return current === last;
            }
        }

        if (!compare(last.current, state)) {
            onChange(state, last.current)
        } else {
        }

        last.current = state;
    }, [state, comparator, onChange])

    return [state, setState];
}
