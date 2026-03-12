/*
 * Copyright (c) 2016 Charles University, Faculty of Arts,
 *                    Department of Linguistics
 * Copyright (c) 2016 Tomas Machalek <tomas.machalek@gmail.com>
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

import * as React from 'react';
import { IActionDispatcher, BoundWithProps } from 'kombo';
import { List, pipe } from 'cnc-tskit';

import * as Kontext from '../../../types/kontext.js';
import * as PluginInterfaces from '../../../types/plugins/index.js';
import { init as initSpeechViews } from './speech.js';
import { ConcDetailModel, ConcDetailModelState } from '../../../models/concordance/detail.js';
import { RefsDetailModel, RefsDetailModelState } from '../../../models/concordance/refsDetail.js';
import { Actions } from '../../../models/concordance/actions.js';
import { DetailExpandPositions, RefsColumn } from '../../../models/concordance/common.js';
import * as S from './style.js';
import { AudioPlayerModel } from '../../../models/audioPlayer/model.js';

const YOUTUBE_RE = /https?:\/\/(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)/i;

const isYoutubeUrl = (url:string) => YOUTUBE_RE.test(url);

const parseStartSeconds = (raw:string):number|null => {
    if (!raw) {
        return null;
    }
    const trimmed = raw.trim();
    if (/^\d+(\.\d+)?$/.test(trimmed)) {
        return parseFloat(trimmed);
    }
    const parts = trimmed.split(':').map(v => parseFloat(v));
    if (parts.some(v => Number.isNaN(v))) {
        return null;
    }
    // supports hh:mm:ss, mm:ss, or ss
    return parts.reduce((acc, v) => acc * 60 + v, 0);
};

const exportYoutubeEmbedUrl = (url:string, startAt?:number|null):string => {
    if (!isYoutubeUrl(url)) {
        return url;
    }
    const urlObj = new URL(url);
    const params = new URLSearchParams(urlObj.searchParams);
    let videoId:string|null = null;
    if (urlObj.hostname.indexOf('youtu.be') > -1) {
        const path = urlObj.pathname.replace(/^\//, '');
        videoId = path || null;
    } else {
        videoId = params.get('v');
        params.delete('v');
    }
    params.delete('t');
    params.delete('start');
    if (startAt !== undefined && startAt !== null) {
        params.set('start', Math.max(0, Math.floor(startAt)).toString());
    }
    const query = params.toString();
    return `https://www.youtube.com/embed/${videoId || ''}${query ? `?${query}&autoplay=1` : '?autoplay=1'}`;
};

const extractVideoInfo = (data:Array<[RefsColumn, RefsColumn]>) => {
    const cols:RefsColumn[] = pipe(
        data,
        List.flatMap(([a, b]) => [a, b].filter(Boolean) as RefsColumn[])
    );

    const videoUrl = List.find(
        c => {
            const n = c.name.toLowerCase();
            const looksLikeDocUrl = n === 'doc.url' || n === 'url' || (n.indexOf('doc') > -1 && n.indexOf('url') > -1);
            const looksLikeVideoExt = /\.(mp4|webm|ogg)$/i.test(c.val);
            return looksLikeDocUrl || looksLikeVideoExt || isYoutubeUrl(c.val);
        },
        cols
    )?.val || null;

    const startSeconds = List.find(
        c => {
            const n = c.name.toLowerCase();
            return n === 'time.start' || n === 'start' || (n.indexOf('time') > -1 && n.indexOf('start') > -1);
        },
        cols
    );

    return {
        videoUrl,
        startSeconds: startSeconds ? parseStartSeconds(startSeconds.val) : null
    };
};


export interface RefDetailProps {
    closeClickHandler:()=>void;
}


export interface ConcordanceDetailProps {
    textDirectionRTL:boolean;
    closeClickHandler:()=>void;
}


export interface VideoPopupProps {
    videoUrl:string;
    startSeconds:number|null;
    closeClickHandler:()=>void;
}

export interface DetailViews {
    RefDetail:React.ComponentClass<RefDetailProps>;
    ConcordanceDetail:React.ComponentClass<ConcordanceDetailProps>;
    VideoPopup:React.FC<VideoPopupProps>;
}


export interface DetailModuleArgs {
    dispatcher:IActionDispatcher;
    he:Kontext.ComponentHelpers;
    concDetailModel:ConcDetailModel;
    refsDetailModel:RefsDetailModel;
    audioPlayerModel:AudioPlayerModel;
}

export function init({dispatcher, he, concDetailModel, refsDetailModel, audioPlayerModel}:DetailModuleArgs):DetailViews {

    const layoutViews = he.getLayoutViews();
    const SpeechView = initSpeechViews(dispatcher, he, concDetailModel, audioPlayerModel);

    // ------------------------- <CustomPopupBox /> ---------------------------

    const CustomPopupBox:React.FC<{
        customClass:string;
        customStyle?:React.CSSProperties;
        takeFocus:boolean;
        onCloseClick:()=>void;
        children?:React.ReactNode;

    }> = (props) => {
        const baseCSS:React.CSSProperties = {
            position: 'fixed',
            bottom: '1em',
            left: '50%',
            transform: 'translate(-50%, 0)'
        };
        return (
            <layoutViews.PopupBox
                    onCloseClick={props.onCloseClick}
                    customClass={props.customClass}
                    customStyle={{...baseCSS, ...props.customStyle}}
                    takeFocus={props.takeFocus}>
                {props.children}
            </layoutViews.PopupBox>
        );
    };

    // ------------------------- <RefValue /> ---------------------------

    const RefValue:React.FC<{
        val:string;
        onVideoClick?:(url:string, startSeconds?:number|null)=>void;
        startSeconds?:number|null;
        forceVideo?:boolean;

    }> = (props) => {
        const isUrl = props.val.indexOf('http://') === 0 || props.val.indexOf('https://') === 0;
        const hasVideoExt = /\.(mp4|webm|ogg)$/i.test(props.val);
        const isVideo = props.forceVideo || (isUrl && (hasVideoExt || isYoutubeUrl(props.val)));

        if (isUrl && isVideo && props.onVideoClick) {
            const handleClick:React.MouseEventHandler<HTMLAnchorElement> = (evt) => {
                evt.preventDefault();
                props.onVideoClick(props.val, props.startSeconds);
            };
            return <a className="external video-link" href={props.val} onClick={handleClick}>
                <layoutViews.Shortener text={props.val} limit={20} />
            </a>;

        } else if (isUrl) {
            return <a className="external" href={props.val} target="_blank">
                <layoutViews.Shortener text={props.val} limit={20} />
            </a>;

        } else {
            return <span>{props.val}</span>;
        }
    };


    // ------------------------- <RefLine /> ---------------------------

    const RefLine:React.FC<{
        colGroups:Array<{name:string; val:string}>;
        onVideoClick?:(url:string, startSeconds?:number|null)=>void;
        videoStartSeconds?:number|null;

    }> = (props) => {

        const renderCols = () => {
            const ans = [];
            const item = props.colGroups;

            if (item[0]) {
                const isDocUrl = (() => {
                    const n = item[0].name.toLowerCase();
                    return n === 'doc.url' || n === 'url' || (n.indexOf('doc') > -1 && n.indexOf('url') > -1);
                })();
                ans.push(<th key="c1">{item[0].name}</th>);
                ans.push(
                    <td key="c2" className="data">
                        <RefValue val={item[0].val}
                                onVideoClick={props.onVideoClick}
                                startSeconds={props.videoStartSeconds}
                                forceVideo={isDocUrl} />
                    </td>
                );

            } else {
                ans.push(<th key="c1" />);
                ans.push(<td key="c2" />);
            }
            if (item[1]) {
                const isDocUrl = (() => {
                    const n = item[1].name.toLowerCase();
                    return n === 'doc.url' || n === 'url' || (n.indexOf('doc') > -1 && n.indexOf('url') > -1);
                })();
                ans.push(<th key="c3">{item[1].name}</th>);
                ans.push(
                    <td key="c4" className="data">
                        <RefValue val={item[1].val}
                                onVideoClick={props.onVideoClick}
                                startSeconds={props.videoStartSeconds}
                                forceVideo={isDocUrl} />
                    </td>
                );

            } else {
                ans.push(<th key="c3" />);
                ans.push(<td key="c4" />);
            }
            return ans;
        };

        return <tr>{renderCols()}</tr>;
    };

    // ------------------------- <RefDetail /> ---------------------------

    const RefDetail:React.FC<RefDetailProps & RefsDetailModelState> = (props) => {

        const [activeVideoUrl, setActiveVideoUrl] = React.useState<string|null>(null);
        const [startAt, setStartAt] = React.useState<number|null>(null);
        const videoRef = React.useRef<HTMLVideoElement>(null);

        const videoMeta = React.useMemo(() => extractVideoInfo(props.data), [props.data]);

        const handleVideoClick = (url:string, startFromLink?:number|null) => {
            setActiveVideoUrl(url);
            const finalStart = startFromLink !== undefined ? startFromLink : videoMeta.startSeconds;
            setStartAt(finalStart ?? null);
        };

        React.useEffect(
            () => {
                if (videoRef.current && startAt !== null) {
                    const seek = () => {
                        try {
                            videoRef.current.currentTime = startAt;
                        } catch (e) {
                            // ignore seek errors (e.g. media not ready)
                        }
                    };
                    if (videoRef.current.readyState >= 1) {
                        seek();
                    } else {
                        const onLoaded = () => {
                            seek();
                            videoRef.current.removeEventListener('loadedmetadata', onLoaded);
                        };
                        videoRef.current.addEventListener('loadedmetadata', onLoaded);
                        return () => videoRef.current?.removeEventListener('loadedmetadata', onLoaded);
                    }
                }
            },
            [activeVideoUrl, startAt]
        );

        const renderContents = () => {
            if (props.isBusy) {
                return <img src={he.createStaticUrl('img/ajax-loader.gif')} alt={he.translate('global__loading')} />;

            } else if (props.data.length === 0) {
                return <p><strong>{he.translate('global__no_data_avail')}</strong></p>;

            } else {
                return(
                    <table className="full-ref">
                        <tbody>
                            {List.map(
                                (item, i) => <RefLine key={i} colGroups={item}
                                        onVideoClick={handleVideoClick}
                                        videoStartSeconds={videoMeta.startSeconds} />,
                                props.data
                            )}
                        </tbody>
                    </table>
                );
            }
        }

        return (
            <CustomPopupBox onCloseClick={props.closeClickHandler} customClass="refs-detail"
                    takeFocus={true}>
                <S.RefsDetail>
                    {renderContents()}
                    {activeVideoUrl ?
                        <div className="video-player-popup">
                            {isYoutubeUrl(activeVideoUrl) ?
                                <iframe
                                    src={exportYoutubeEmbedUrl(activeVideoUrl, startAt)}
                                    style={{width: '100%', height: '60vh', border: 'none'}}
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                /> :
                                <video
                                    key={activeVideoUrl}
                                    ref={videoRef}
                                    src={activeVideoUrl}
                                    controls
                                    autoPlay
                                    style={{maxWidth: '100%', maxHeight: '60vh'}}
                                />
                            }
                        </div> :
                        null
                    }
                </S.RefsDetail>
            </CustomPopupBox>
        );
    }

    const BoundRefDetail = BoundWithProps<RefDetailProps, RefsDetailModelState>(RefDetail, refsDetailModel);

    // ------------------------- <ExpandConcDetail /> ---------------------------

    const ExpandConcDetail:React.FC<{
        position:DetailExpandPositions;
        isWaiting:boolean;
        clickHandler:()=>void;

    }> = (props) => {

        const createTitle = () => {
            if (props.position === 'left') {
                return he.translate('concview__click_to_expand_left');

            } else if (props.position === 'right') {
                return he.translate('concview__click_to_expand_right');
            }
        };

        const createAlt = () => props.position === 'left' ?
            he.translate('concview__expand_left_symbol') :
            he.translate('concview__expand_right_symbol');

        const createImgPath = () => props.position === 'left' ?
            he.createStaticUrl('/img/sort_asc.svg') :
            he.createStaticUrl('/img/sort_desc.svg');

        if (!props.isWaiting) {
            return (
                <a className={`expand${props.position === 'left' ? ' left' : ''}`}
                        title={createTitle()} onClick={props.clickHandler}>
                    <img src={createImgPath()} alt={createAlt()} />
                </a>
            );

        } else {
            return (
                <img className="expand"
                        src={he.createStaticUrl('img/ajax-loader-bar.gif')}
                        alt={he.translate('global__loading')} />
            );
        }
    };

    // ------------------------- <TokenExternalInfo /> ---------------------------

    const TokenExternalInfo:React.FC<{
        tokenConnectIsBusy:boolean;
        tokenConnectData:PluginInterfaces.TokenConnect.TCData;

    }> = (props) => {
        if (props.tokenConnectIsBusy) {
            return (
                <div className="token-detail" style={{textAlign: 'center'}}>
                    <layoutViews.AjaxLoaderImage />
                </div>
            );

        } else {
            return (
                <div className="token-detail">
                    <h2 className="token">{'"'}{props.tokenConnectData.token}{'"'}</h2>
                    <dl>
                    {pipe(
                        props.tokenConnectData.renders,
                        List.filter(r => !r.isKwicView),
                        List.map(
                            (v, i) => (
                                v.found ?
                                    <React.Fragment key={`resource:${i}`}>
                                        <dt>
                                        {v.heading ?
                                            <>
                                                <img src={he.createStaticUrl('img/book.svg')}
                                                        alt={he.translate('global__icon_book')} />
                                                {v.heading}:
                                            </> :
                                            null
                                        }
                                        </dt>
                                        <dd>
                                        <layoutViews.ErrorBoundary>
                                            <v.renderer data={v.contents} />
                                        </layoutViews.ErrorBoundary>
                                        </dd>
                                        {i > 0 ? <hr /> : null}
                                    </React.Fragment> :
                                    null
                            )
                        )
                    )}
                    </dl>
                </div>
            );
        }
    };

    // ------------------------- <TokenExternalKWICView /> ---------------------------

    const TokenExternalKWICView:React.FC<{
        tokenConnectIsBusy:boolean;
        tokenConnectData:Array<PluginInterfaces.TokenConnect.DataAndRenderer>;
        viewMode:string;
        expandingSide:DetailExpandPositions;

    }> = (props) => {

        const isWaitingExpand = (side) => {
            return props.tokenConnectIsBusy && props.expandingSide === side;
        };

        const expandClickHandler = (position:DetailExpandPositions) => {
            dispatcher.dispatch<typeof Actions.ExpandKwicDetail>({
                name: Actions.ExpandKwicDetail.name,
                payload: {
                    position: position
                }
            });
        };

        if (props.tokenConnectIsBusy && props.expandingSide === null) {
            return (
                <div className="token-detail" style={{textAlign: 'center'}}>
                    <layoutViews.AjaxLoaderImage />
                </div>
            );

        } else {
            const data = props.tokenConnectData.find(x => x.heading === props.viewMode);
            if (data) {
                return (
                    <div className="token-detail">
                        <layoutViews.ErrorBoundary>
                            {data.contents.expand_left_args ?
                                <ExpandConcDetail position="left" isWaiting={isWaitingExpand('left')}
                                    clickHandler={() => expandClickHandler('left')} />
                                : null
                            }

                            <data.renderer data={data.contents} />

                            {data.contents.expand_right_args ?
                                <ExpandConcDetail position="right" isWaiting={isWaitingExpand('right')}
                                    clickHandler={() => expandClickHandler('right')} />
                                : null
                            }
                        </layoutViews.ErrorBoundary>
                    </div>
                );
            } else {
                return <div className="token-detail"></div>
            }
        }
    };

    // ------------------------- <KwicDetailView /> ---------------------------

    const KwicDetailView:React.FC<{
        modelIsBusy:boolean;
        hasExpandLeft:boolean;
        hasExpandRight:boolean;
        expandingSide:string;
        data:Array<{class:string; str:string}>;
        canDisplayWholeDocument:boolean;

    }> = (props) => {

        const isWaitingExpand = (side) => {
            return props.modelIsBusy && props.expandingSide === side;
        };

        const expandClickHandler = (position) => {
            dispatcher.dispatch<typeof Actions.ExpandKwicDetail>({
                name: Actions.ExpandKwicDetail.name,
                payload: {
                    position: position
                }
            });
        };

        const handleDisplayWholeDocumentClick = () => {
            dispatcher.dispatch<typeof Actions.ShowWholeDocument>({
                name: Actions.ShowWholeDocument.name
            });
        };

        return (
            <div>
                {props.hasExpandLeft ?
                    <ExpandConcDetail position="left" isWaiting={isWaitingExpand('left')}
                        clickHandler={() => expandClickHandler('left')} />
                : null
                }

                {List.map(
                    (item, i) => (
                        <span key={i} className={item.class ? item.class : null}>{item.str + ' '}</span>
                    ),
                    (props.data || [])
                )}

                {props.hasExpandRight ?
                    <ExpandConcDetail position="right" isWaiting={isWaitingExpand('right')}
                            clickHandler={() => expandClickHandler('right')} />
                    : null
                }
                {props.canDisplayWholeDocument ?
                    <div className="footer">
                        <a id="ctx-link" onClick={handleDisplayWholeDocumentClick}>
                            {he.translate('concview__display_whole_document')}
                        </a>
                    </div>
                    : null
                }
            </div>
        );
    };

    // ------------------------- <DefaultView /> ---------------------------

    const DefaultView:React.FC<{
        data:Array<{str:string; class:string}>;
        hasExpandLeft:boolean;
        hasExpandRight:boolean;
        canDisplayWholeDocument:boolean;
        expandingSide:string;
        modelIsBusy:boolean;
        textDirectionRTL:boolean;

    }> = (props) => {
        return (
            <div className="concordance_DefaultView" style={{direction: props.textDirectionRTL ? 'rtl' : 'ltr'}}>
                {props.data.length > 0 ?
                    <KwicDetailView modelIsBusy={props.modelIsBusy}
                                    expandingSide={props.expandingSide}
                                    hasExpandLeft={props.hasExpandLeft}
                                    hasExpandRight={props.hasExpandRight}
                                    data={props.data}
                                    canDisplayWholeDocument={props.canDisplayWholeDocument} /> :
                    null
                }
            </div>
        );
    }

    // ------------------------- <MenuLink /> ---------------------------

    const MenuLink:React.FC<{
        active:boolean;
        label:string;
        clickHandler:()=>void;

    }> = (props) => {

        if (!props.active) {
            return (
                <a onClick={props.clickHandler}>
                    {props.label}
                </a>
            );

        } else {
            return (
                <strong>
                    {props.label}
                </strong>
            );
        }
    };

    // ------------------------- <ConcDetailMenu /> ---------------------------

    const ConcDetailMenu:React.FC<{
        supportsSpeechView:boolean;
        mode:string; // TODO enum
        tcData:Array<PluginInterfaces.TokenConnect.DataAndRenderer>;

    }> = (props) => {

        const handleMenuClick = (mode) => {
            dispatcher.dispatch<typeof Actions.DetailSwitchMode>({
                name: Actions.DetailSwitchMode.name,
                payload: {
                    value: mode
                }
            });
        };

        if (props.supportsSpeechView || props.tcData.length > 0) {
            return (
                <ul className="view-mode">
                    <li className={props.mode === 'default' ? 'current' : null}>
                        <MenuLink clickHandler={handleMenuClick.bind(null, 'default')}
                            label={he.translate('concview__detail_default_mode_menu')}
                            active={props.mode === 'default'} />
                    </li>
                    {props.supportsSpeechView ?
                        <li className={props.mode === 'speech' ? 'current' : null}>
                            <MenuLink clickHandler={handleMenuClick.bind(null, 'speech')}
                                label={he.translate('concview__detail_speeches_mode_menu')}
                                active={props.mode === 'speech'} />
                        </li> : null
                    }
                    {List.map(d => (
                        <li key={`tcItem:${d.heading}`}>
                            <MenuLink clickHandler={handleMenuClick.bind(null, d.heading)}
                                label={d.heading}
                                active={props.mode === d.heading}
                                />
                        </li>),
                        props.tcData
                    )}
                </ul>
            );

        } else {
            return <div className="view-mode" />;
        }
    };

    // ------------------------- <ConcordanceDetail /> ---------------------------

    class ConcordanceDetail extends React.PureComponent<ConcordanceDetailProps & ConcDetailModelState> {

        _renderContents() {
            switch (this.props.mode) {
                case 'default':
                    return <DefaultView data={this.props.concDetail}
                                hasExpandLeft={ConcDetailModel.hasExpandLeft(this.props)}
                                hasExpandRight={ConcDetailModel.hasExpandRight(this.props)}
                                canDisplayWholeDocument={ConcDetailModel.canDisplayWholeDocument(this.props)}
                                expandingSide={this.props.expandingSide}
                                modelIsBusy={this.props.isBusy}
                                textDirectionRTL={this.props.textDirectionRTL} />;
                case 'speech':
                    return <SpeechView />;
                default:
                    return <TokenExternalKWICView tokenConnectIsBusy={this.props.isBusy}
                                tokenConnectData={this.props.tokenConnectData.renders} viewMode={this.props.mode}
                                expandingSide={this.props.expandingSide} />;
            }
        }

        render() {
            const kwicViewRenders = List.filter(r => r.isKwicView, this.props.tokenConnectData.renders);
            const customCSS:React.CSSProperties = {overflowY: 'auto'};
            return (
                <CustomPopupBox onCloseClick={this.props.closeClickHandler}
                        customClass={`conc-detail${kwicViewRenders.length > 0 ? ' custom' : ''}`}
                        customStyle={customCSS}
                        takeFocus={true}>
                    <S.ConcordanceDetail>
                        <ConcDetailMenu supportsSpeechView={ConcDetailModel.supportsSpeechView(this.props)} mode={this.props.mode}
                                tcData={kwicViewRenders} />
                        {this._renderContents()}
                        {this.props.concDetail.length > 0 && concDetailModel.supportsTokenConnect() ?
                            <hr /> : null
                        }
                        {concDetailModel.supportsTokenConnect() || this.props.tokenConnectIsBusy ?
                            <TokenExternalInfo tokenConnectData={this.props.tokenConnectData}
                                tokenConnectIsBusy={this.props.tokenConnectIsBusy} /> : null}
                    </S.ConcordanceDetail>
                </CustomPopupBox>
            );
        }
    }

    const BoundConcordanceDetail = BoundWithProps<ConcordanceDetailProps, ConcDetailModelState>(ConcordanceDetail, concDetailModel);

    // ------------------------- <VideoPopup /> ---------------------------

    const VideoPopup:React.FC<VideoPopupProps> = (props) => {
        const [size, setSize] = React.useState({width: 640, height: 400});
        const [position, setPosition] = React.useState({x: 100, y: 100});
        const [isDragging, setIsDragging] = React.useState(false);
        const [isResizing, setIsResizing] = React.useState(false);
        const [dragStart, setDragStart] = React.useState({x: 0, y: 0});
        const popupRef = React.useRef<HTMLDivElement>(null);

        const exportYoutubeEmbedUrl = (url:string, startAt?:number|null):string => {
            const urlObj = new URL(url);
            const params = new URLSearchParams(urlObj.searchParams);
            let videoId:string|null = null;
            if (urlObj.hostname.indexOf('youtu.be') > -1) {
                const path = urlObj.pathname.replace(/^\//, '');
                videoId = path || null;
            } else {
                videoId = params.get('v');
                params.delete('v');
            }
            params.delete('t');
            params.delete('start');
            if (startAt !== undefined && startAt !== null) {
                params.set('start', Math.max(0, Math.floor(startAt)).toString());
            }
            const query = params.toString();
            return `https://www.youtube.com/embed/${videoId || ''}${query ? `?${query}&autoplay=1` : '?autoplay=1'}`;
        };

        const handleMouseDown = (e:React.MouseEvent) => {
            if ((e.target as HTMLElement).classList.contains('video-popup-header')) {
                setIsDragging(true);
                setDragStart({x: e.clientX - position.x, y: e.clientY - position.y});
                e.preventDefault();
            }
        };

        const handleResizeMouseDown = (e:React.MouseEvent) => {
            setIsResizing(true);
            e.preventDefault();
            e.stopPropagation();
        };

        React.useEffect(() => {
            const handleMouseMove = (e:MouseEvent) => {
                if (isDragging) {
                    setPosition({
                        x: e.clientX - dragStart.x,
                        y: e.clientY - dragStart.y
                    });
                } else if (isResizing && popupRef.current) {
                    const rect = popupRef.current.getBoundingClientRect();
                    const newWidth = Math.max(400, e.clientX - rect.left);
                    const newHeight = Math.max(300, e.clientY - rect.top);
                    setSize({width: newWidth, height: newHeight});
                }
            };

            const handleMouseUp = () => {
                setIsDragging(false);
                setIsResizing(false);
            };

            if (isDragging || isResizing) {
                document.addEventListener('mousemove', handleMouseMove);
                document.addEventListener('mouseup', handleMouseUp);
                return () => {
                    document.removeEventListener('mousemove', handleMouseMove);
                    document.removeEventListener('mouseup', handleMouseUp);
                };
            }
        }, [isDragging, isResizing, dragStart]);

        return (
            <div
                ref={popupRef}
                style={{
                    position: 'fixed',
                    left: `${position.x}px`,
                    top: `${position.y}px`,
                    width: `${size.width}px`,
                    height: `${size.height}px`,
                    backgroundColor: '#f7f9fc',
                    border: '1px solid #e2eaea',
                    boxShadow: '5px 5px 7px #aaa',
                    borderRadius: '5px',
                    zIndex: 1000,
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                    padding: '1.4em'
                }}
            >
                <div
                    className="video-popup-header"
                    onMouseDown={handleMouseDown}
                    style={{
                        position: 'relative',
                        paddingBottom: '0.4em',
                        cursor: 'move',
                        userSelect: 'none',
                        marginBottom: '0.7em'
                    }}
                >
                    <button
                        onClick={props.closeClickHandler}
                        style={{
                            display: 'block',
                            position: 'absolute',
                            padding: '0.1em',
                            margin: 0,
                            width: '1em',
                            height: '1em',
                            top: '-1em',
                            right: '-1em',
                            border: 'none',
                            backgroundColor: 'transparent',
                            cursor: 'pointer',
                            fontSize: '1em',
                            backgroundImage: `url(${he.createStaticUrl('img/close-icon.svg')})`,
                            backgroundSize: '1em 1em',
                            backgroundRepeat: 'no-repeat',
                            backgroundPosition: '0.1em 0.1em',
                            boxSizing: 'content-box'
                        }}
                        title="Close"
                    />
                    <div
                        onMouseDown={(e) => {
                            setIsDragging(true);
                            setDragStart({x: e.clientX - position.x, y: e.clientY - position.y});
                            e.preventDefault();
                        }}
                        style={{
                            position: 'absolute',
                            left: '-1em',
                            top: '-1em',
                            padding: '0.1em',
                            width: '1em',
                            height: '1em',
                            backgroundImage: `url(${he.createStaticUrl('img/movable.svg')})`,
                            backgroundSize: '100% 100%',
                            backgroundRepeat: 'no-repeat',
                            cursor: 'move'
                        }}
                    />
                </div>
                <div style={{flex: 1, position: 'relative', minHeight: 0}}>
                    <iframe
                        src={exportYoutubeEmbedUrl(props.videoUrl, props.startSeconds)}
                        style={{width: '100%', height: '100%', border: 'none'}}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                    />
                </div>
                <div
                    onMouseDown={handleResizeMouseDown}
                    style={{
                        position: 'absolute',
                        right: '0.3em',
                        bottom: '0.3em',
                        width: '16px',
                        height: '16px',
                        cursor: 'nwse-resize',
                        background: 'linear-gradient(135deg, transparent 50%, #999 50%)'
                    }}
                />
            </div>
        );
    };

    return {
        RefDetail: BoundRefDetail,
        ConcordanceDetail: BoundConcordanceDetail,
        VideoPopup
    };
}