/*
 * Copyright (c) 2021 Charles University, Faculty of Arts,
 *                    Department of Linguistics
 * Copyright (c) 2021 Tomas Machalek <tomas.machalek@gmail.com>
 *
 * This program is free software; you can redistribute it and/or
 * modify it under the terms of the GNU General Public License
 * as published by the Free Software Foundation; version 2
 * dated June, 1991.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.

 * You should have received a copy of the GNU General Public License
 * along with this program; if not, write to the Free Software
 * Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301, USA.
 */

import { styled, css } from 'styled-components';
import { keyframes } from 'styled-components';
import backgroundSrc from '../../../../img/groovepaper2.jpg';

export function preloadImages(...images) {
    if (window['preloadedImages'] === undefined) window['preloadedImages'] = {};
    images.forEach(src => {
        if (window['preloadedImages'][src] === undefined) {
            const img = new Image();
            img.src = src;
            window['preloadedImages'][src] = img;
        }
    })
}

preloadImages(backgroundSrc);

export const mediaPhone = '@media screen and (max-width: 479px)';
export const mediaNoPhone = '@media screen and (min-width: 480px)';
export const mediaTablet = '@media screen and (max-width: 1200px), screen and (orientation:portrait)';

export const mainBackground = `url(${backgroundSrc})`;

// texts
export const defaultFontFamily = '"Roboto", "Segoe UI", Arial, sans-serif';
export const monospaceFontFamily = '"Cousine", "Courier New", monospace';
export const condensedFontFamily = '"Roboto Condensed", "Segoe UI", sans-serif';

export const colorDefaultText = '#292524';
export const colorDefaultTextBg = '#fffbf5';
export const colorLightText = '#78716c';
export const colorSuperlightText = '#a8a29e';
export const colorWhiteText = '#fafaf9';
export const colorDarkGreenText = '#44403c';
export const textShadow = '0 0 2px #d6d3d1';


// general colors

export const colorSectionBg = '#fef7f0';

export const colorDefaultGreen = '#a0c5ad';
export const colorLightGreen = '#f0fdf4';
export const colorGreenBgHighlighted = '#fef3c7';
export const defaultBgHighlighted = colorGreenBgHighlighted;

export const colorLogoPink = '#b53e25';
export const colorLightPink = '#fed7aa';
export const colorLogoBlue = '#0891b2';
export const colorLogoGreen = '#84cc16';
export const colorLogoBlueOpaque = 'RGBA(8, 145, 178, 0.7)';
export const colorLogoBlueShining = '#06b6d4';
export const colorWhitelikeBlue = '#ecfeff';
export const colorLogoOrange = '#ea580c';
export const colorBgLightBlue = '#cffafe';
export const colorLightFrame = '#fed7aa';
export const colorLockedAttrsBgColor = '#e7e5e4';
export const colorLightGrey = '#d6d3d1';
export const colorLinkDark = '#c2410c';
export const colorTableEvenBg = '#fef2e8';
export const colorFrameFieldset = '#fed7aa';
export const colorTableOddRowBg = '#fffbf5';
export const colorDataTableFooter = '#fed7aa';
export const colorWidgetOrange = '#b53e25';
export const colorButtonDefault = '#fff7ed';
export const colorButtonHover = '#ffedd5';
export const colorErrorInputBg = '#fecaca';

export const colorInputBorder = '#57534e';
export const colorInputBorderDisabled = '#a8a29e';

export const colorHeatmap = [
    '#fffbf5', '#fff7ed',
    '#fed7aa', '#fdba74',
    '#fb923c', '#b53e25',
    '#ea580c', '#c2410c',
    '#9a3412', '#7c2d12'
];

export const colorCategoricalData = [
    "#b53e25", "#fb923c",
    "#84cc16", "#a3e635",
    "#eab308", "#facc15",
    "#ef4444", "#f87171",
    "#0891b2", "#06b6d4",
    "#d946ef", "#e879f9",
    "#f59e0b", "#fbbf24",
    "#14b8a6"
]

export const shRegexp = '#dc2626';
export const shAttr = colorLogoPink;
export const shKeyword = '#65a30d';
export const shOperator = '#d946ef';

// misc.

export const borderRadiusDefault = '5px';
export const borderRadiusMenu = '5px 5px 0 0';
export const portalBoxShadow = '0 1px 3px 0 rgba(124, 45, 18, 0.1), 0 1px 2px 0 rgba(124, 45, 18, 0.06)';
export const ucnkTopbarLeftMargin = '30px';

// forms

export const inputBorderStyle = `1px solid ${colorLightGrey}`;
export const inputBorderRadius = '3px';
export const defaultFieldsetPadding = '1.7em 1.1em';


// sizes

export const closeButtonSize = '1.1em';
export const navigIconSize = '1em';
export const pageFormMargin = '1.5em';


export const GeneralLabel = styled.label`
  display: inline-block;
  text-decoration: none;
  font-size: 1.1em;
  padding: 0.3em;
  white-space: nowrap;
`;

export const DefaultButton = styled.button`
    font-size: 1em;
    color: ${colorWhiteText};
    text-decoration: none;
    padding: 0.3em 0.7em;
    background-color: ${colorLogoBlue};
    border-radius: 0.2em;
    border: 1px solid ${colorLogoBlue};
    box-shadow: 0px 1px 2px rgba(000, 000, 000, 0.5), inset 0px 0px 2px rgba(255, 255, 255, 0.2);
`;

export const DangerButton = styled(DefaultButton)`
    background-color: ${colorLogoPink};
    border: 1px solid ${colorLogoPink};
`;

export const UtilButton = styled.button`
    display: inline-block;
    border: 1px solid ${colorLogoBlue};
    border-radius: ${inputBorderRadius};
    background-color: ${colorButtonDefault};
    text-decoration: none;
    padding: 3px 8px;
    color: ${colorLogoBlue};
    box-shadow: 0px 1px 2px rgba(150, 150, 150, 0.9), inset 0px 0px 2px rgba(215, 215, 215, 0.2);
    cursor: default;
`;

export const DisabledButton = styled.button`
    display: inline-block;
    border: 1px solid ${colorSuperlightText};
    border-radius: ${inputBorderRadius};
    background-color: #ffffff;
    text-decoration: none;
    padding: 3px 8px;
    color: ${colorSuperlightText};
    box-shadow: 0px 1px 2px rgba(150, 150, 150, 0.9), inset 0px 0px 2px rgba(215, 215, 215, 0.2);
    cursor: default;
`;

export const FadeIn = keyframes`

    /* transition: opacity .3s ease-in; */
    from {
        opacity: 0;
    }

    to {
        opacity: 1;
    }
`;

export const FadeOut = keyframes`
    from {
        opacity: 1;
    }

    to {
        opacity: 0;
    }
`;

export const ColorChange  = keyframes`
    0% { opacity: 0; }
    100% { opacity: 1; }
`;

export const textHighlight = css`
    font-weight: bold;
    background-color: ${colorGreenBgHighlighted};
    color: ${colorLightText};
    border: 1px solid ${colorLightText};
    border-radius: ${borderRadiusDefault};
    display: inline-block;
    padding: 0 0.3em 0 0.3em;
`;


export const textNoHighlight = css`
    font-weight: bold;
    border: 1px solid transparent;
    border-radius: ${borderRadiusDefault};
    display: inline-block;
    padding: 0 0.3em 0 0.3em;
`;

// ---------------- <ExpandableSectionLabel /> -----------------------------------

export const ExpandableSectionLabel = styled.h2`
    margin: 0 0 0.4em 0;
    padding: 0.2em;
    font-size: 1.05em;
    font-weight: normal;

    .ExpandButton {
        margin-right: 0.7em;
    }

    a,
    span {
        font-weight: normal;
        color: ${colorLogoBlue};
        text-decoration: none;
    }

    a:hover {
        text-decoration: underline;
    }
`;