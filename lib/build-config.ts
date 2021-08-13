export interface BuildConfig
{
    readonly AWSAccountID: string;
    readonly AWSProfileName: string;
    readonly AWSProfileRegion: string;

    readonly App: string;
    readonly Environment: string;
    readonly Version: string;
    readonly Build: string;

    readonly Parameters: BuildParameters;
}

export interface BuildParameters{
    readonly ClienteName: string;
    readonly DomainClientFrontEnd: string;
    readonly EcrArnClientFrontEnd: string;
    readonly DomainBackofficeFrontEnd: string;
    readonly EcrArnBackofficeFrontEnd: string;
}