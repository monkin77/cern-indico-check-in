interface IconFeatherProps {
  className?: HTMLDivElement['className'];
}

const IconFeather = ({className}: IconFeatherProps) => {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M22 2s-7.64-.37-13.66 7.88C3.72 16.21 2 22 2 22l1.94-1c1.44-2.5 2.19-3.53 3.6-5 2.53.74 5.17.65 7.46-2-2-.56-3.6-.43-5.96-.19C11.69 12 13.5 11.6 16 12l1-2c-1.8-.34-3-.37-4.78.04C14.19 8.65 15.56 7.87 18 8l1.21-1.93c-1.56-.11-2.5.06-4.29.5 1.61-1.46 3.08-2.12 5.22-2.25 0 0 1.05-1.89 1.86-2.32z" />
    </svg>
  );
};

export default IconFeather;
