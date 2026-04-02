import { useEffect, useRef } from "react";
import { FlatList } from "react-native";

type UseAutoCarouselProps = {
  dataLength: number;
  interval?: number;
  itemWidth: number;
};

export const useAutoCarousel = ({
  dataLength,
  interval = 3000,
  itemWidth,
}: UseAutoCarouselProps) => {
  const listRef = useRef<FlatList>(null);
  const indexRef = useRef(0);

  useEffect(() => {
    if (!dataLength) return;

    const timer = setInterval(() => {
      indexRef.current += 1;

      listRef.current?.scrollToOffset({
        offset: indexRef.current * itemWidth,
        animated: true,
      });

      if (indexRef.current === dataLength) {
        setTimeout(() => {
          indexRef.current = 0;
          listRef.current?.scrollToOffset({
            offset: 0,
            animated: false,
          });
        }, 500);
      }
    }, interval);

    return () => clearInterval(timer);
  }, [dataLength, interval, itemWidth]);

  return listRef;
};
