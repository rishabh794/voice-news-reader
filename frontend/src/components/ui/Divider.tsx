import type { HTMLAttributes } from 'react';

const Divider = ({ className = '', ...props }: HTMLAttributes<HTMLDivElement>) => {
    const classes = ['h-px w-full bg-border/80', className].filter(Boolean).join(' ');
    return <div className={classes} {...props} />;
};

export default Divider;
