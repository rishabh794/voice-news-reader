import type { HTMLAttributes } from 'react';

const SectionContainer = ({ className = '', ...props }: HTMLAttributes<HTMLDivElement>) => {
    const classes = [
        'mx-auto w-full max-w-[1400px] px-6 lg:px-10',
        className
    ]
        .filter(Boolean)
        .join(' ');

    return <div className={classes} {...props} />;
};

export default SectionContainer;
