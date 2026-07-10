import React from 'react';
import * as icons from 'lucide-react';
import type { LucideProps } from 'lucide-react';

interface IconProps extends LucideProps {
    name: string;
}

const Icon: React.FC<IconProps> = ({ name, ...props }) => {
    // @ts-ignore - dynamic index signature
    const LucideIcon = icons[name];
    
    if (!LucideIcon) {
        return <icons.Folder {...props} />;
    }
    
    return <LucideIcon {...props} />;
};

export default Icon;
