import * as React from 'react';
import { Title, Label, Select, Button } from 'Component';
import { I, S, U, translate, Action, analytics, Renderer, Preview } from 'Lib';
import { observer } from 'mobx-react';

const PopupSettingsOnboarding = observer(class PopupSettingsOnboarding extends React.Component<I.Popup> {

	config: any = {};
	refMode = null;

	constructor (props: I.Popup) {
		super(props);

		this.onUpload = this.onUpload.bind(this);
		this.onSave = this.onSave.bind(this);
		this.onPathClick = this.onPathClick.bind(this);
		this.onChangeStorage = this.onChangeStorage.bind(this);
		this.onResetStorage = this.onResetStorage.bind(this);
		this.onConfirmStorage = this.onConfirmStorage.bind(this);
		this.onTooltipShow = this.onTooltipShow.bind(this);
		this.onTooltipHide = this.onTooltipHide.bind(this);
	};

	render () {
		const { mode, path, userPath } = this.config;
		const { interfaceLang } = S.Common;
		const interfaceLanguages = U.Menu.getInterfaceLanguages();
		const isDefault = path == U.Common.getElectron().defaultPath();
		const networkModes: any[] = ([
			{ id: I.NetworkMode.Default },
			{ id: I.NetworkMode.Local },
			{ id: I.NetworkMode.Custom },
		] as any[]).map(it => {
			it.name = translate(`networkMode${it.id}Title`);
			it.description = translate(`networkMode${it.id}Text`);
			it.withDescription = true;
			return it;
		});

		return (
			<div className="mainSides">
				<div id="sideRight" className="side right tabOnboarding">
					<Title text={translate('popupSettingsPersonalTitle')} />

					<div className="actionItems">
						<div className="item">
							<Label text={translate('popupSettingsPersonalInterfaceLanguage')} />

							<Select
								id="interfaceLang"
								value={interfaceLang}
								options={interfaceLanguages}
								onChange={v => Action.setInterfaceLang(v)}
								arrowClassName="black"
								menuParam={{ 
									horizontal: I.MenuDirection.Right, 
									width: 300,
									className: 'fixed',
								}}
							/>
						</div>

						<div className="item">
							<Label text={translate('popupSettingsOnboardingModeTitle')} />
							<Select
								id="networkMode"
								ref={ref => this.refMode = ref}
								value={String(mode || '')}
								options={networkModes}
								onChange={v => this.onChange('mode', v)}
								arrowClassName="black"
								menuParam={{ 
									horizontal: I.MenuDirection.Right, 
									width: 300,
									className: 'fixed',
								}}
							/>
						</div>

						{mode == I.NetworkMode.Custom ? (
							<div className="item" onMouseEnter={e => this.onTooltipShow(e, path)} onMouseLeave={this.onTooltipHide}>
								<div onClick={() => this.onPathClick(path)}>
									<Label text={translate('popupSettingsOnboardingNetworkTitle')} />
									{path ? <Label className="small" text={U.Common.shorten(path, 32)} /> : ''}
								</div>
								<Button className="c28" text={translate('commonUpload')} onClick={this.onUpload} />
							</div>
						) : ''}

						<div className="item" onMouseEnter={e => this.onTooltipShow(e, userPath)} onMouseLeave={this.onTooltipHide}>
							<div onClick={() => this.onPathClick(userPath)}>
								<Label text={translate('popupSettingsOnboardingStoragePath')} />
								<Label className="small" text={U.Common.shorten(userPath, 32)} />
							</div>
							<div className="buttons">
								<Button className="c28" text={translate('commonChange')} onClick={this.onChangeStorage} />
								{!isDefault ? <Button className="c28" text={translate('commonReset')} onClick={this.onResetStorage} /> : ''}
							</div>
						</div>
					</div>

					<div className="buttons">
						<Button text={translate('commonSave')} onClick={this.onSave} />
					</div>
				</div>
			</div>
		);
	};

	componentDidMount(): void {
		const { networkConfig } = S.Auth;
		const { mode, path } = networkConfig;
		const userPath = U.Common.getElectron().userPath();

		this.config = {
			userPath,
			mode,
			path: path || ''
		};
		this.refMode?.setValue(this.config.mode);
		this.forceUpdate();
	};

	onChange (key: string, value: any) {
		this.config[key] = value;
		this.forceUpdate();
	};

	onUpload () {
		Action.openFileDialog([ 'yml' ], (paths: string[]) => this.onChange('path', paths[0]));
	};

	onSave () {
		const { networkConfig } = S.Auth;
		const userPath = U.Common.getElectron().userPath();

		if (this.config.mode !== networkConfig.mode) {
			analytics.event('SelectNetwork', { route: analytics.route.onboarding, type: this.config.mode });
		};

		if (this.config.path !== networkConfig.path) {
			analytics.event('UploadNetworkConfiguration', { route: analytics.route.onboarding });
		};

		if (this.config.userPath !== userPath) {
			Renderer.send('setUserDataPath', this.config.userPath);
			S.Common.dataPathSet(this.config.userPath);
			delete this.config.userPath;

			analytics.event('SetUserDataPath', { route: analytics.route.onboarding });
		};

		S.Auth.networkConfigSet(this.config);
		this.props.close();
	};

	onPathClick (path: string) {
		if (path) {
			Renderer.send('openPath', U.Common.getElectron().dirname(path));
		};
	};

	onChangeStorage () {
		const onConfirm = () => {
			Action.openDirectoryDialog({}, (paths: string[]) => this.onChange('userPath', paths[0]));
		};

		if (this.config.mode == I.NetworkMode.Local) {
			this.onConfirmStorage(onConfirm);
		} else {
			onConfirm();
		};
	};

	onResetStorage () {
		const onConfirm = () => {
			this.onChange('userPath', U.Common.getElectron().defaultPath());
		};

		if (this.config.mode == I.NetworkMode.Local) {
			this.onConfirmStorage(onConfirm);
		} else {
			onConfirm();
		};
	};

	onConfirmStorage (onConfirm: () => void) {
		S.Popup.open('confirm', {
			data: {
				title: translate('commonAreYouSure'),
				text: translate('popupSettingsOnboardingLocalOnlyWarningText'),
				textConfirm: translate('popupSettingsOnboardingLocalOnlyWarningConfirm'),
				onConfirm,
			},
		});
	};

	onTooltipShow (e: any, text: string) {
		Preview.tooltipShow({ text, element: $(e.currentTarget) });
	};

	onTooltipHide () {
		Preview.tooltipHide();
	};

});

export default PopupSettingsOnboarding;
